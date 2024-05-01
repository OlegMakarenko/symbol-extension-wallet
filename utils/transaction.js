import { TransactionType } from '@/constants';
import { getMosaicRelativeAmount } from './mosaic';
import { toFixedNumber } from './helper';
import { PrivateKey, PublicKey, utils } from 'symbol-sdk';
import { SymbolFacade, MessageEncoder, models } from 'symbol-sdk/symbol';
import { transactionToSymbol } from './transaction-to-symbol';
const { NamespaceId, TransactionFactory, UnresolvedAddress } = models;

export const isAggregateTransaction = (transaction) => {
    return transaction.type === TransactionType.AGGREGATE_BONDED || transaction.type === TransactionType.AGGREGATE_COMPLETE ||  transaction.type.value === TransactionType.AGGREGATE_BONDED || transaction.type.value === TransactionType.AGGREGATE_COMPLETE;
};

export const getTransactionFees = (transaction, networkProperties) => {
    const stubKeySigner = 'BE0B4CF546B7B4F4BBFCFF9F574FDA527C07A53D3FC76F8BB7DB746F8E8E0A9F';
    const stubKeyRecipient = 'F312748473BFB2D61689F680AE5C6E4003FA7EE2B0EC407ADF82D15A1144CF4F';
    const stubAddress = 'TB3KUBHATFCPV7UZQLWAQ2EUR6SIHBSBEOEDDDF';
    const {
        transactionFees,
        networkCurrency: { divisibility },
    } = networkProperties;
    const stubTransaction = {
        ...transaction,
        signerPublicKey: stubKeySigner,
        recipientPublicKey: stubKeyRecipient,
        recipientAddress: stubAddress,
    };
    const stubCurrentAccount = {
        privateKey: stubKeySigner,
        publicKey: stubKeySigner,
    };
    const size = transactionToSymbol(stubTransaction, networkProperties, stubCurrentAccount).size;

    const fast = (transactionFees.minFeeMultiplier + transactionFees.averageFeeMultiplier) * size;
    const medium = (transactionFees.minFeeMultiplier + transactionFees.averageFeeMultiplier * 0.65) * size;
    const slow = (transactionFees.minFeeMultiplier + transactionFees.averageFeeMultiplier * 0.35) * size;

    return {
        fast: toFixedNumber(getMosaicRelativeAmount(fast, divisibility), divisibility),
        medium: toFixedNumber(getMosaicRelativeAmount(medium, divisibility), divisibility),
        slow: toFixedNumber(getMosaicRelativeAmount(slow, divisibility), divisibility),
    };
};

export const transactionFromPayload = (payload) => {
    const transactionHex = utils.hexToUint8(payload);

    return TransactionFactory.deserialize(transactionHex);
};

export const getUnresolvedIdsFromSymbolTransaction = (transactions) => {
    const mosaicIds = [];
    const namespaceIds = [];
    const addresses = [];

    const transactionsUnresolvedFieldsMap = {
        [TransactionType.TRANSFER]: {
            address: ['recipientAddress'],
            mosaicArray: ['mosaics'],
        },
        [TransactionType.ADDRESS_ALIAS]: {
            namespace: ['namespaceId'],
        },
        [TransactionType.MOSAIC_ALIAS]: {
            namespace: ['namespaceId'],
        },
        [TransactionType.MOSAIC_SUPPLY_REVOCATION]: {
            address: ['sourceAddress'],
            mosaic: ['mosaic'],
        },
        [TransactionType.MULTISIG_ACCOUNT_MODIFICATION]: {
            addressArray: ['addressAdditions', 'addressDeletions'],
        },
        [TransactionType.HASH_LOCK]: {
            mosaic: ['mosaic'],
        },
        [TransactionType.SECRET_LOCK]: {
            address: ['recipientAddress'],
            mosaic: ['mosaic'],
        },
        [TransactionType.SECRET_PROOF]: {
            address: ['recipientAddress'],
        },
        [TransactionType.ACCOUNT_ADDRESS_RESTRICTION]: {
            addressArray: ['restrictionAdditions', 'restrictionDeletions'],
        },
        [TransactionType.MOSAIC_ADDRESS_RESTRICTION]: {
            address: ['targetAddress'],
            mosaic: ['mosaicId'],
        },
        [TransactionType.MOSAIC_GLOBAL_RESTRICTION]: {
            mosaic: ['referenceMosaicId'],
        },
        [TransactionType.ACCOUNT_METADATA]: {
            address: ['targetAddress'],
        },
        [TransactionType.MOSAIC_METADATA]: {
            address: ['targetAddress'],
            mosaic: ['targetMosaicId'],
        },
        [TransactionType.NAMESPACE_METADATA]: {
            address: ['targetAddress'],
            namespace: ['targetNamespaceId'],
        },
    };

    const isNamespaceId = (unresolvedAddress) => {
        return new UnresolvedAddress(unresolvedAddress.bytes).toString().length !== 48;
    };

    transactions.forEach((transaction) => {
        const transactionFieldsToResolve = transactionsUnresolvedFieldsMap[transaction.type.value];

        if (isAggregateTransaction(transaction)) {
            const unresolved = getUnresolvedIdsFromSymbolTransaction(transaction.transactions);
            mosaicIds.push(...unresolved.mosaicIds);
            namespaceIds.push(...unresolved.namespaceIds);
            addresses.push(...unresolved.addresses);
        }

        if (!transactionFieldsToResolve) {
            return;
        }

        Object.keys(transactionFieldsToResolve).forEach((mode) => {
            const fields = transactionFieldsToResolve[mode];

            fields.forEach((field) => {
                const value = transaction[field];

                if (mode === 'address' && isNamespaceId(value)) {
                    addresses.push({
                        namespaceId: new NamespaceId(value.bytes).toString(),
                        height: transaction.transactionInfo?.height,
                    });
                } else if (mode === 'addressArray' && Array.isArray(value)) {
                    value
                        .filter((address) => isNamespaceId(address))
                        .forEach((address) =>
                            addresses.push({
                                namespaceId: new NamespaceId(address.value.bytes),
                                height: transaction.transactionInfo?.height,
                            })
                        );
                } else if (mode === 'mosaic') {
                    if (value.mosaicId) {
                        mosaicIds.push(value.mosaicId.toString().replace('0x', ''));
                    }
                    else if (value.id) {
                        mosaicIds.push(value.id.toString().replace('0x', ''));
                    }
                    else {
                        mosaicIds.push(value.toString().replace('0x', ''));
                    }
                } else if (mode === 'mosaicArray' && Array.isArray(value)) {
                    value.forEach((mosaic) => mosaicIds.push(mosaic.mosaicId.toString().replace('0x', '')));
                } else if (mode === 'namespace') {
                    namespaceIds.push(value.value.toString(16));
                }
            });
        });
    });

    return {
        mosaicIds: [...new Set(mosaicIds.flat())],
        namespaceIds: [...new Set(namespaceIds.flat())],
        addresses: [...new Set(addresses.flat())],
    };
};

export const isOutgoingTransaction = (transaction, currentAccount) => transaction.signerAddress === currentAccount.address;

export const isIncomingTransaction = (transaction, currentAccount) => transaction.recipientAddress === currentAccount.address;

export const encryptMessage = (messageText, recipientPublicKey, privateKey) => {
    const _privateKey = new PrivateKey(privateKey);
    const _recipientPublicKey = new PublicKey(recipientPublicKey);
    const keyPair = new SymbolFacade.KeyPair(_privateKey);
    const messageEncoder = new MessageEncoder(keyPair);
    const messageBytes = Buffer.from(messageText, 'utf-8');
    const encodedBytes = messageEncoder.encodeDeprecated(_recipientPublicKey, messageBytes);

    return Buffer.from(encodedBytes).toString('hex');
}

export const decryptMessage = (encryptedMessageHex, recipientPublicKey, privateKey) => {
    const _privateKey = new PrivateKey(privateKey);
    const _recipientPublicKey = new PublicKey(recipientPublicKey);
    const keyPair = new SymbolFacade.KeyPair(_privateKey);
    const messageEncoder = new MessageEncoder(keyPair);
    const messageBytes = Buffer.from(encryptedMessageHex, 'hex');
    const { message } = messageEncoder.tryDecodeDeprecated(_recipientPublicKey, messageBytes);

    return Buffer.from(message).toString('utf-8');
};

/**
 * Checks whether transaction is awaiting a signature by account.
 */
export const isTransactionAwaitingSignatureByAccount = (transaction, account) => {
    if (transaction.type !== TransactionType.AGGREGATE_BONDED) {
        return false;
    }

    const isSignedByAccount = transaction.signerAddress === account.address;
    const hasAccountCosignature = transaction.receivedCosignatures.some((address) => address === account.address);

    return !isSignedByAccount && !hasAccountCosignature;
};

export const filterAllowedTransactions = (transactions, blackList) => {
    return transactions.filter((transaction) => blackList.every((contact) => contact.address !== transaction.signerAddress));
};

export const filterBlacklistedTransactions = (transactions, blackList) => {
    return transactions.filter((transaction) => blackList.some((contact) => contact.address === transaction.signerAddress));
};

export const isHarvestingServiceTransaction = (transaction) => {
    if (!isAggregateTransaction(transaction)) {
        return false;
    }

    const keyLinkTypes = [TransactionType.ACCOUNT_KEY_LINK, TransactionType.VRF_KEY_LINK, TransactionType.NODE_KEY_LINK];

    let hasKeyLinkTransaction = false;
    let hasUnrelatedTypes = false;
    const transferTransactions = [];

    transaction.innerTransactions.forEach((innerTransaction) => {
        const isKeyLinkTransaction = keyLinkTypes.some((type) => type === innerTransaction.type);
        if (isKeyLinkTransaction) {
            hasKeyLinkTransaction = true;
            return;
        }

        const isTransferTransaction = innerTransaction.type === TransactionType.TRANSFER;
        if (isTransferTransaction) {
            transferTransactions.push(innerTransaction);
            return;
        }

        hasUnrelatedTypes = true;
    });

    if (hasUnrelatedTypes || !hasKeyLinkTransaction) {
        return false;
    }

    const hasTransferTransactionWrongMessage = !!transferTransactions[0] && !transferTransactions[0].message?.isDelegatedHarvestingMessage;

    if (transferTransactions.length > 1 || hasTransferTransactionWrongMessage) {
        return false;
    }

    return true;
};
