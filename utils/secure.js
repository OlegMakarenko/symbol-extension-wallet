import { PersistentStorage, SecureStorage } from '@/storage';
import { createWalletAccount } from './account';
import symbolSdk from 'symbol-sdk';
import { Events } from '@/constants';
import { createNetworkMap } from './helper';
import { transactionToSymbol } from './transaction-to-symbol';

export const isMnemonicStored = async () => {
    return !!(await SecureStorage.getMnemonicEncrypted());
}

export const signTransaction = async (password, networkProperties, transaction, currentAccount) => {
    console.log('transaction', transaction)
    // Get current account private key from SecureStorage
    const accounts = await SecureStorage.getAccounts(password);
    const networkAccounts = accounts[networkProperties.networkIdentifier];
    const currentAccountWithPrivateKey = networkAccounts.find(account => account.publicKey === currentAccount.publicKey);

    // Map transaction
    const transactionObject = transactionToSymbol(transaction, networkProperties, currentAccount);
    console.log('transactionObject', transactionObject)

    // Get signature
    const facade = new symbolSdk.facade.SymbolFacade(networkProperties.networkIdentifier);
    const privateKey = new symbolSdk.PrivateKey(currentAccountWithPrivateKey.privateKey);
    const keyPair = new symbolSdk.facade.SymbolFacade.KeyPair(privateKey);
    const signature = facade.signTransaction(keyPair, transactionObject);

    // Attach signature
    const jsonString = facade.transactionFactory.constructor.attachSignature(transactionObject, signature);

    console.log('jsonString', jsonString)

    return JSON.parse(jsonString).payload
}

export const signTransactionPayload = async (password, networkIdentifier, payload, currentAccount) => {
    // Get current account private key from SecureStorage
    const accounts = await SecureStorage.getAccounts(password);
    const networkAccounts = accounts[networkIdentifier];
    const currentAccountPrivateKey = networkAccounts.find(account => account.publicKey === currentAccount.publicKey).privateKey

    // Get signature
    const facade = new symbolSdk.facade.SymbolFacade(networkIdentifier);
    const privateKey = new symbolSdk.PrivateKey(currentAccountPrivateKey);
    const keyPair = new symbolSdk.facade.SymbolFacade.KeyPair(privateKey);
    const payloadBytes = symbolSdk.utils.hexToUint8(payload);
	const transaction = symbolSdk.symbol.TransactionFactory.deserialize(payloadBytes);
    const signature = facade.signTransaction(keyPair, transaction);

    // Attach signature
    const jsonString = facade.transactionFactory.constructor.attachSignature(transaction, signature);

    return JSON.parse(jsonString).payload
}

export const getWalletAccounts = async (password) => {
    const accounts = await SecureStorage.getAccounts(password);

    return createNetworkMap((networkIdentifier) => accounts[networkIdentifier]
        .map(account => createWalletAccount(
            account.privateKey,
            account.networkIdentifier,
            account.name,
            account.accountType,
            account.index
        ))
    );
}

export const logOut = async () => {
    await SecureStorage.removeAll();
    await PersistentStorage.removeAll();
    document.dispatchEvent(new CustomEvent(Events.LOGIN));
}
