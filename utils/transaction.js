import { TransactionType } from '@/constants';
import { getMosaicRelativeAmount } from './mosaic';
import { toFixedNumber } from './helper';
import symbolSdk from 'symbol-sdk';

export const isAggregateTransaction = (transaction) => {
    return transaction.type === TransactionType.AGGREGATE_BONDED || transaction.type === TransactionType.AGGREGATE_COMPLETE ||  transaction.type.value === TransactionType.AGGREGATE_BONDED || transaction.type.value === TransactionType.AGGREGATE_COMPLETE;
};

export const getTransactionFees = (transaction, networkProperties, transactionSize) => {
    const {
        transactionFees,
        networkCurrency: { divisibility },
    } = networkProperties;
    const stubTransaction = {
        ...transaction,
        recipientPublicKey: '1111111111111111111111111111111111111111111111111111111111111111',
        recipientAddress: 'TB3KUBHATFCPV7UZQLWAQ2EUR6SIHBSBEOEDDDF',
    };
    const stubCurrentAccount = {
        privateKey: '0000000000000000000000000000000000000000000000000000000000000000',
    };
    const size = transactionSize || transactionToDTO(stubTransaction, networkProperties, stubCurrentAccount).size;

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
    const transactionHex = symbolSdk.utils.hexToUint8(payload);

    return symbolSdk.symbol.TransactionFactory.deserialize(transactionHex);
};

export const transactionToDTO = () => ({ size: 100 });

export const getUnresolvedIdsFromTransactionDTOs = (transactions) => {
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
        return new symbolSdk.symbol.UnresolvedAddress(unresolvedAddress.bytes).toString().length !== 48;
    };

    transactions.forEach((transaction) => {
        const transactionFieldsToResolve = transactionsUnresolvedFieldsMap[transaction.type.value];

        if (isAggregateTransaction(transaction)) {
            const unresolved = getUnresolvedIdsFromTransactionDTOs(transaction.transactions);
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
                        namespaceId: new symbolSdk.symbol.NamespaceId(value.bytes).toString(),
                        height: transaction.transactionInfo?.height,
                    });
                } else if (mode === 'addressArray' && Array.isArray(value)) {
                    value
                        .filter((address) => isNamespaceId(address))
                        .forEach((address) =>
                            addresses.push({
                                namespaceId: new symbolSdk.symbol.NamespaceId(address.value.bytes),
                                height: transaction.transactionInfo?.height,
                            })
                        );
                } else if (mode === 'mosaic') {
                    mosaicIds.push(value.mosaicId.toString().replace('0x', ''));
                } else if (mode === 'mosaicArray' && Array.isArray(value)) {
                    value.forEach((mosaic) => mosaicIds.push(mosaic.mosaicId.toString().replace('0x', '')));
                } else if (mode === 'namespace') {
                    namespaceIds.push(value.toHex());
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

export const decryptMessage = (encryptedMessage, recipientPrivateKey, senderPublicKey) => {
    const hex = Crypto.decode(recipientPrivateKey, senderPublicKey, encryptedMessage);

    return Buffer.from(hex, 'hex').toString();
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
