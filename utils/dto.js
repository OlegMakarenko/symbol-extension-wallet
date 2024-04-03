import { TransactionType } from '@/constants';
import { addressFromPublicKey } from './account';
import { getMosaicRelativeAmount, getNativeMosaicAmount } from './mosaic';
import symbolSdk from 'symbol-sdk';
import { isIncomingTransaction, isOutgoingTransaction } from './transaction';

const addressFromDTO = (address) => {
    return new symbolSdk.symbol.Address(Buffer.from(address, 'hex')).toString()
}

export const transactionFromDTO = (transactionDTO, config) => {
    console.log('transactionFromDTO ', transactionDTO)
    const { transaction } = transactionDTO;
    const baseTransaction = baseTransactionFromDTO(transactionDTO, config);

    switch (transaction.type) {
        case TransactionType.AGGREGATE_BONDED:
        case TransactionType.AGGREGATE_COMPLETE:
            return aggregateTransactionFromDTO(transactionDTO, config);
        case TransactionType.TRANSFER:
            return transferTransactionFromDTO(transactionDTO, config);
    }

    return baseTransaction;
};

export const baseTransactionFromDTO = (transactionDTO, config) => {
    const { meta, transaction } = transactionDTO;
    const signerPublicKey = transaction.signerPublicKey;

    return {
        type: transaction.type,
        deadline: Number(transaction.deadline) + config.networkProperties.epochAdjustment * 1000,
        timestamp: Number(meta.timestamp) + config.networkProperties.epochAdjustment * 1000,
        height: Number(meta.height),
        hash: meta.hash,
        fee: transaction.maxFee ? getMosaicRelativeAmount(transaction.maxFee, config.networkProperties.networkCurrency.divisibility) : null,
        signerAddress: signerPublicKey ? addressFromPublicKey(signerPublicKey, config.networkProperties.networkIdentifier) : null,
        signerPublicKey,
    };
};

export const aggregateTransactionFromDTO = (transactionDTO, config) => {
    const { transaction } = transactionDTO;
    const baseTransaction = baseTransactionFromDTO(transactionDTO, config);
    const innerTransactions = transaction.innerTransactions?.map((innerTransaction) => transactionFromDTO(innerTransaction, config)) || [];

    const info = {
        ...baseTransaction,
        cosignaturePublicKeys: transaction.cosignatures.map((cosignature) =>
            cosignature.signerPublicKey),
        amount: innerTransactions.reduce((accumulator, transaction) =>
            accumulator + (transaction.amount || 0), 0),
        innerTransactions,
    };

    if (transaction.type === TransactionType.AGGREGATE_BONDED) {
        info.receivedCosignatures = info.cosignaturePublicKeys.map(publicKey => addressFromPublicKey(publicKey, config.networkProperties.networkIdentifier));
    }

    return info;
}

export const transferTransactionFromDTO = (transactionDTO, config) => {
    const { transaction } = transactionDTO;
    const { networkProperties, mosaicInfos, currentAccount, resolvedAddresses } = config;
    const baseTransaction = baseTransactionFromDTO(transactionDTO, config);
    const mosaics = transaction.mosaics//.map(mapMosaic);
    //const formattedMosaics = getMosaicsWithRelativeAmounts(mosaics, mosaicInfos);
    const nativeMosaicAbsoluteAmount = getNativeMosaicAmount(mosaics, networkProperties.networkCurrency.mosaicId);
    const nativeMosaicAmount = getMosaicRelativeAmount(nativeMosaicAbsoluteAmount, networkProperties.networkCurrency.divisibility)
    const transactionBody = {
        ...baseTransaction,
        recipientAddress: addressFromDTO(transaction.recipientAddress, resolvedAddresses),
    };
    let resultAmount = 0;

    if (isIncomingTransaction(transactionBody, currentAccount) && !isOutgoingTransaction(transactionBody, currentAccount)) {
        resultAmount = nativeMosaicAmount;
    } else if (!isIncomingTransaction(transactionBody, currentAccount) && isOutgoingTransaction(transactionBody, currentAccount)) {
        resultAmount = -nativeMosaicAmount;
    }

    if (transaction.message) {
        const messageBytes = Buffer.from(transaction.message, 'hex');
        const messageType = messageBytes[0];
        const isMessagePlain = messageType === 0;
        const isMessageEncrypted = messageType === 1;
        const isDelegatedHarvestingMessage = messageType === 254;
        const isMessageRaw = messageType === !isMessagePlain && !isMessageEncrypted && !isDelegatedHarvestingMessage;
        let messagePayload = null;

        switch (true) {
            case isMessagePlain:
                messagePayload = Buffer.from(messageBytes.subarray(1)).toString();
            break;
            case isMessageEncrypted:
                messagePayload = transaction.message;
            break;
            case isDelegatedHarvestingMessage:
            case isMessageRaw:
                messagePayload = transaction.message;
            break;
        }


        transactionBody.message = {
            encryptedText: isMessageEncrypted ? messagePayload : null,
            text: isMessagePlain ? messagePayload : null,
            payload: (isDelegatedHarvestingMessage || isMessageRaw) ? messagePayload : null,
            isRaw: isMessageRaw,
            isEncrypted: isMessageEncrypted,
            isDelegatedHarvestingMessage,
        };
    }

    return {
        ...transactionBody,
        mosaics: [],//formattedMosaics,
        amount: resultAmount,
    };
}
