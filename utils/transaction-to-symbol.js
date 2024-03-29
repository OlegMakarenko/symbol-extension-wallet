import { AddressRestrictionFlag, AddressRestrictionFlagMessage, AliasAction, AliasActionMessage, LinkAction, LinkActionMessage, Message, MosaicRestrictionFlag, MosaicRestrictionFlagMessage, MosaicRestrictionType, MosaicRestrictionTypeMessage, MosaicSupplyChangeAction, MosaicSupplyChangeActionMessage, NamespaceRegistrationType, NamespaceRegistrationTypeMessage, OperationRestrictionFlag, OperationRestrictionFlagMessage, TransactionType } from '@/constants';
import { ChronoUnit, Instant } from '@js-joda/core';
import _ from 'lodash';
import symbolSdk from 'symbol-sdk';
import { encryptMessage } from './transaction';

const createSymbolTransaction = (transactionDescriptor, networkProperties, isEmbedded) => {
    const facade = new symbolSdk.facade.SymbolFacade(networkProperties.networkIdentifier);

    if (isEmbedded) {
        return facade.transactionFactory.createEmbedded(_.omit(transactionDescriptor, 'fee', 'deadline'));
    }
    else {
        return facade.transactionFactory.create(transactionDescriptor);
    }
}

const createFee = (transaction, networkProperties) => {
    if (!transaction.fee) return 0n;

    const { divisibility } = networkProperties.networkCurrency;
    return BigInt(Math.round(Math.pow(10, divisibility) * transaction.fee));
};

const createMetadataKey = (key) => BigInt(`0x${key}`);

const createId = id => BigInt(`0x${id}`);

const createMosaic = (mosaic) => ({
    mosaicId: createId(mosaic.id),
    amount: BigInt(Math.pow(10, mosaic.divisibility) * mosaic.amount)
});

const createDeadline = (transaction, networkProperties, hours = 2) => {
    if (transaction.deadline) {
        return BigInt(transaction.deadline)
    }

    const deadlineDateTime = Instant.now().plus(hours, ChronoUnit.HOURS);
    const deadline = deadlineDateTime.minusSeconds(networkProperties.epochAdjustment).toEpochMilli();

    return BigInt(deadline);
}

export const transactionToSymbol = (transaction, networkProperties, currentAccount, isEmbedded) => {
    switch (transaction.type) {
        case TransactionType.AGGREGATE_BONDED:
        case TransactionType.AGGREGATE_COMPLETE:
            return aggregateTransactionToSymbol(transaction, networkProperties, currentAccount);
        case TransactionType.TRANSFER:
            return transferTransactionToSymbol(transaction, networkProperties, currentAccount, isEmbedded);
        case TransactionType.ADDRESS_ALIAS:
            return addressAliasTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.MOSAIC_ALIAS:
            return mosaicAliasTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.NAMESPACE_REGISTRATION:
            return namespaceRegistrationTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.MOSAIC_DEFINITION:
            return mosaicDefinitionTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.MOSAIC_SUPPLY_CHANGE:
            return mosaicSupplyChangeTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.MOSAIC_SUPPLY_REVOCATION:
            return mosaicSupplyRevocationTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.HASH_LOCK:
            return hashLockTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.SECRET_LOCK:
            return secretLockTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.SECRET_PROOF:
            return secretProofTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.VRF_KEY_LINK:
            return vrfKeyLinkTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.ACCOUNT_KEY_LINK:
            return accountKeyLinkTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.NODE_KEY_LINK:
            return nodeKeyLinkTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.VOTING_KEY_LINK:
            return votingKeyLinkTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.MOSAIC_GLOBAL_RESTRICTION:
            return mosaicGlobalRestrictionTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.MOSAIC_ADDRESS_RESTRICTION:
            return mosaicAddressRestrictionTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.ACCOUNT_OPERATION_RESTRICTION:
            return accountOperationRestrictionTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.ACCOUNT_ADDRESS_RESTRICTION:
            return accountAddressRestrictionTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.ACCOUNT_MOSAIC_RESTRICTION:
            return accountMosaicRestrictionTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.MULTISIG_ACCOUNT_MODIFICATION:
            return multisigAccountModificationTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.ACCOUNT_METADATA:
            return accountMetadataTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.NAMESPACE_METADATA:
            return namespaceMetadataTransactionToSymbol(transaction, networkProperties, isEmbedded);
        case TransactionType.MOSAIC_METADATA:
            return mosaicMetadataTransactionToSymbol(transaction, networkProperties, isEmbedded);
    }

    return null;
};


export const aggregateTransactionToSymbol = (transaction, networkProperties, currentAccount) => {
    const facade = new symbolSdk.facade.SymbolFacade(networkProperties.networkIdentifier);
    const innerTransactions = transaction.innerTransactions.map((innerTransaction) =>
        transactionToSymbol(innerTransaction, networkProperties, currentAccount, true)
    );
    const merkleHash = facade.constructor.hashEmbeddedTransactions(innerTransactions);

    let descriptor;

    if (transaction.type === TransactionType.AGGREGATE_BONDED) {
        descriptor = {
            type: 'aggregate_bonded_transaction_v2',
            signerPublicKey: transaction.signerPublicKey,
            fee: createFee(transaction, networkProperties),
            deadline: createDeadline(transaction, networkProperties),
            transactionsHash: merkleHash,
            transactions: innerTransactions,
        };
    }
    else {
        descriptor = {
            type: 'aggregate_complete_transaction_v2',
            signerPublicKey: transaction.signerPublicKey,
            fee: createFee(transaction, networkProperties),
            deadline: createDeadline(transaction, networkProperties),
            transactionsHash: merkleHash,
            transactions: innerTransactions,
        };
    }

    return createSymbolTransaction(descriptor, networkProperties, false);
};

export const transferTransactionToSymbol = (transaction, networkProperties, currentAccount, isEmbedded) => {
    const descriptor = {
        type: 'transfer_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        recipientAddress: transaction.recipientAddress,
        mosaics: transaction.mosaics.map(createMosaic)
    };

    if (transaction.message?.isRaw || transaction.message?.isDelegatedHarvestingMessage) {
        descriptor.message = Buffer.from(transaction.message.payload, 'hex');
    } else if (transaction.message?.isEncrypted) {
        const encryptedText = transaction.message.text
            ? encryptMessage(
                transaction.message.text,
                transaction.recipientPublicKey,
                currentAccount.privateKey
            )
            : transaction.message.encryptedText;
        descriptor.message = Buffer.from(encryptedText, 'hex');
    } else if (transaction.message?.text) {
        const bytes = new TextEncoder().encode(transaction.message.text)
        descriptor.message = new Uint8Array([0, ...bytes]);
    }

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const namespaceRegistrationTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    let descriptor;

    if (transaction.registrationType === NamespaceRegistrationTypeMessage[NamespaceRegistrationType.RootNamespace]) {
        descriptor = {
            type: 'namespace_registration_transaction_v1',
            signerPublicKey: transaction.signerPublicKey,
            deadline: createDeadline(transaction, networkProperties),
            fee: createFee(transaction, networkProperties),
            duration: transaction.duration === Message.UNLIMITED ? 0n : BigInt(transaction.duration),
            name: transaction.namespaceName,
            registrationType: 'root',
        };
    } else {
        descriptor = {
            type: 'namespace_registration_transaction_v1',
            signerPublicKey: transaction.signerPublicKey,
            deadline: createDeadline(transaction, networkProperties),
            fee: createFee(transaction, networkProperties),
            parentId: createId(transaction.parentId),
            name: transaction.namespaceName,
            registrationType: 'child',
        };
    }

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const addressAliasTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const descriptor = {
        type: 'address_alias_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        namespaceId: createId(transaction.namespaceId),
		address: transaction.address,
		aliasAction: transaction.aliasAction === AliasActionMessage[AliasAction.Link] ? 'link' : 'unlink'
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const mosaicAliasTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const descriptor = {
        type: 'mosaic_alias_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        namespaceId: createId(transaction.namespaceId),
		mosaicId: createId(transaction.mosaicId),
		aliasAction: AliasActionMessage[AliasAction.Link] === transaction.aliasAction ? AliasAction.Link : AliasAction.Unlink
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const mosaicDefinitionTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const flags = [];
    if(transaction.isTransferable) flags.push('transferable');
    if(transaction.isSupplyMutable) flags.push('supply_mutable');
    if(transaction.isRestrictable) flags.push('restrictable');
    if(transaction.isRevokable) flags.push('revokable');

    const descriptor = {
        type: 'mosaic_definition_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        duration: BigInt(transaction.duration),
		flags: flags.join(' '),
		nonce: transaction.nonce,
		divisibility: transaction.divisibility
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const mosaicSupplyChangeTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const action =
        MosaicSupplyChangeActionMessage[MosaicSupplyChangeAction.Increase] === transaction.action
            ? MosaicSupplyChangeAction.Increase
            : MosaicSupplyChangeAction.Decrease;

    const descriptor = {
        type: 'mosaic_supply_change_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        delta: BigInt(transaction.delta),
		action,
		mosaicId: createId(transaction.mosaicId),
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const mosaicSupplyRevocationTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const descriptor = {
        type: 'mosaic_supply_revocation_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        mosaic: createMosaic(transaction.mosaic),
        sourceAddress: transaction.sourceAddress
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const hashLockTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const descriptor = {
        type: 'hash_lock_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        mosaic: createMosaic({
            id: networkProperties.networkCurrency.mosaicId,
            divisibility: networkProperties.networkCurrency.divisibility,
            amount: Math.abs(transaction.lockedAmount),
        }),
        duration: BigInt(transaction.duration),
        hash: Buffer.from(transaction.aggregateHash, 'hex')
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const secretLockTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const descriptor = {
        type: 'secret_lock_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        mosaic: createMosaic(transaction.mosaic),
        duration: BigInt(transaction.duration),
        recipientAddress: transaction.recipientAddress,
        secret: transaction.secret,
        hashAlgorithm: transaction.hashAlgorithm.toLowerCase().replace(/ /g, '_')
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const secretProofTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const descriptor = {
        type: 'secret_proof_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        recipientAddress: transaction.recipientAddress,
        secret: transaction.secret,
        hashAlgorithm: transaction.hashAlgorithm.toLowerCase().replace(/ /g, '_'),
        proof: Buffer.from(transaction.proof, 'hex')
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const vrfKeyLinkTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const descriptor = {
        type: 'vrf_key_link_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        linkedPublicKey: transaction.linkedPublicKey,
        linkAction: transaction.linkAction === LinkActionMessage[LinkAction.Link] ? 'link' : 'unlink',
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const accountKeyLinkTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const descriptor = {
        type: 'account_key_link_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        linkedPublicKey: transaction.linkedPublicKey,
        linkAction: transaction.linkAction === LinkActionMessage[LinkAction.Link] ? 'link' : 'unlink',
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const nodeKeyLinkTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const descriptor = {
        type: 'node_key_link_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        linkedPublicKey: transaction.linkedPublicKey,
        linkAction: transaction.linkAction === LinkActionMessage[LinkAction.Link] ? 'link' : 'unlink',
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const votingKeyLinkTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const descriptor = {
        type: 'voting_key_link_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        linkedPublicKey: transaction.linkedPublicKey,
        linkAction: transaction.linkAction === LinkActionMessage[LinkAction.Link] ? 'link' : 'unlink',
        startEpoch: transaction.startEpoch,
        endEpoch: transaction.endEpoch
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const mosaicGlobalRestrictionTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const restrictionTypeMap = {
        [MosaicRestrictionTypeMessage[MosaicRestrictionType.EQ]]: MosaicRestrictionType.EQ,
        [MosaicRestrictionTypeMessage[MosaicRestrictionType.GE]]: MosaicRestrictionType.GE,
        [MosaicRestrictionTypeMessage[MosaicRestrictionType.GT]]: MosaicRestrictionType.GT,
        [MosaicRestrictionTypeMessage[MosaicRestrictionType.LE]]: MosaicRestrictionType.LE,
        [MosaicRestrictionTypeMessage[MosaicRestrictionType.LT]]: MosaicRestrictionType.LT,
        [MosaicRestrictionTypeMessage[MosaicRestrictionType.NE]]: MosaicRestrictionType.NE,
        [MosaicRestrictionTypeMessage[MosaicRestrictionType.NONE]]: MosaicRestrictionType.NONE,
    };

    const descriptor = {
        type: 'mosaic_global_restriction_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        mosaicId: createId(transaction.referenceMosaicId),
        referenceMosaicId: 0n,
        restrictionKey: BigInt(transaction.restrictionKey),
        previousRestrictionValue: BigInt(transaction.previousRestrictionValue),
        newRestrictionValue: BigInt(transaction.newRestrictionValue),
        previousRestrictionType: restrictionTypeMap[transaction.previousRestrictionType],
        newRestrictionType: restrictionTypeMap[transaction.newRestrictionType]
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const mosaicAddressRestrictionTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const descriptor = {
        type: 'mosaic_address_restriction_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        targetAddress: transaction.targetAddress,
        mosaicId: createId(transaction.mosaicId),
        restrictionKey: BigInt(transaction.restrictionKey),
        previousRestrictionValue: BigInt(transaction.previousRestrictionValue),
        newRestrictionValue: BigInt(transaction.newRestrictionValue),
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const accountOperationRestrictionTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const restrictionFlagsMap = {
        [OperationRestrictionFlagMessage[OperationRestrictionFlag.AllowOutgoingTransactionType]]: OperationRestrictionFlag.AllowOutgoingTransactionType,
        [OperationRestrictionFlagMessage[OperationRestrictionFlag.BlockOutgoingTransactionType]]: OperationRestrictionFlag.BlockOutgoingTransactionType,
    };

    const descriptor = {
        type: 'account_operation_restriction_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        restrictionFlags: restrictionFlagsMap[transaction.restrictionType],
        restrictionAdditions: transaction.restrictionOperationAdditions,
        restrictionDeletions: transaction.restrictionOperationDeletions
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const accountAddressRestrictionTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const restrictionFlagsMap = {
        [AddressRestrictionFlagMessage[AddressRestrictionFlag.AllowIncomingAddress]]: AddressRestrictionFlag.AllowIncomingAddress,
        [AddressRestrictionFlagMessage[AddressRestrictionFlag.AllowOutgoingAddress]]: AddressRestrictionFlag.AllowOutgoingAddress,
        [AddressRestrictionFlagMessage[AddressRestrictionFlag.BlockIncomingAddress]]: AddressRestrictionFlag.BlockIncomingAddress,
        [AddressRestrictionFlagMessage[AddressRestrictionFlag.BlockOutgoingAddress]]: AddressRestrictionFlag.BlockOutgoingAddress,
    }
    const descriptor = {
        type: 'account_address_restriction_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        restrictionFlags: restrictionFlagsMap[transaction.restrictionType],
        restrictionAdditions: transaction.restrictionAddressAdditions,
        restrictionDeletions: transaction.restrictionAddressDeletions,
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const accountMosaicRestrictionTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const restrictionFlag = MosaicRestrictionFlagMessage[MosaicRestrictionFlag.AllowMosaic] === transaction.restrictionType ? 'allow' : 'block';

    const descriptor = {
        type: 'account_mosaic_restriction_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        restrictionFlags: `${restrictionFlag} mosaic_id`,
        restrictionAdditions: transaction.restrictionMosaicAdditions.map(createId),
        restrictionDeletions: transaction.restrictionMosaicDeletions.map(createId),
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const multisigAccountModificationTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const descriptor = {
        type: 'multisig_account_modification_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        minApprovalDelta: transaction.minApprovalDelta,
        minRemovalDelta: transaction.minRemovalDelta,
        addressAdditions: transaction.addressAdditions,
        addressDeletions: transaction.addressDeletions,
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const accountMetadataTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const descriptor = {
        type: 'account_metadata_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        targetAddress: transaction.targetAddress,
        scopedMetadataKey: createMetadataKey(transaction.scopedMetadataKey),
        valueSizeDelta: transaction.valueSizeDelta,
        value: transaction.metadataValue //Buffer.from(transaction.metadataValue, 'hex')
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const mosaicMetadataTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const descriptor = {
        type: 'mosaic_metadata_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        targetAddress: transaction.targetAddress,
        scopedMetadataKey: createMetadataKey(transaction.scopedMetadataKey),
        targetMosaicId: createId(transaction.targetMosaicId),
        valueSizeDelta: transaction.valueSizeDelta,
        value: transaction.metadataValue //Buffer.from(transaction.metadataValue, 'hex')
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};

export const namespaceMetadataTransactionToSymbol = (transaction, networkProperties, isEmbedded) => {
    const descriptor = {
        type: 'namespace_metadata_transaction_v1',
        signerPublicKey: transaction.signerPublicKey,
        fee: createFee(transaction, networkProperties),
        deadline: createDeadline(transaction, networkProperties),
        targetAddress: transaction.targetAddress,
        scopedMetadataKey: createMetadataKey(transaction.scopedMetadataKey),
        targetNamespaceId: createId(transaction.targetNamespaceId),
        valueSizeDelta: transaction.valueSizeDelta,
        value: transaction.metadataValue //Buffer.from(transaction.metadataValue, 'hex')
    };

    return createSymbolTransaction(descriptor, networkProperties, isEmbedded);
};
