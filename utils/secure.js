import { PersistentStorage, SecureStorage } from '@/storage';
import { createWalletAccount } from './account';
import { PrivateKey, utils } from 'symbol-sdk';
import { SymbolFacade, models } from 'symbol-sdk/symbol';
import { Events } from '@/constants';
import { createNetworkMap } from './helper';
import { transactionToSymbol } from './transaction-to-symbol';
const { TransactionFactory } = models;

export const isMnemonicStored = async () => {
    return !!(await SecureStorage.getMnemonicEncrypted());
}

export const signTransaction = async (password, networkProperties, transaction, currentAccount) => {
    // Get current account private key from SecureStorage
    const accounts = await SecureStorage.getAccounts(password);
    const networkAccounts = accounts[networkProperties.networkIdentifier];
    const currentAccountWithPrivateKey = networkAccounts.find(account => account.publicKey === currentAccount.publicKey);

    // Map transaction
    const transactionObject = transactionToSymbol(transaction, networkProperties, currentAccountWithPrivateKey);

    // Get signature
    const facade = new SymbolFacade(networkProperties.networkIdentifier);
    const privateKey = new PrivateKey(currentAccountWithPrivateKey.privateKey);
    const keyPair = new SymbolFacade.KeyPair(privateKey);
    const signature = facade.signTransaction(keyPair, transactionObject);

    // Attach signature
    const jsonString = facade.transactionFactory.constructor.attachSignature(transactionObject, signature);
    const hash = facade.hashTransaction(transactionObject).toString();

    return {
        payload: JSON.parse(jsonString).payload,
        hash
    }
}

export const signTransactionPayload = async (password, networkIdentifier, payload, currentAccount) => {
    // Get current account private key from SecureStorage
    const accounts = await SecureStorage.getAccounts(password);
    const networkAccounts = accounts[networkIdentifier];
    const currentAccountPrivateKey = networkAccounts.find(account => account.publicKey === currentAccount.publicKey).privateKey

    // Get signature
    const facade = new SymbolFacade(networkIdentifier);
    const privateKey = new PrivateKey(currentAccountPrivateKey);
    const keyPair = new SymbolFacade.KeyPair(privateKey);
    const payloadBytes = utils.hexToUint8(payload);
	const transaction = TransactionFactory.deserialize(payloadBytes);
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
