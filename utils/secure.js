import { SecureStorage } from '@/storage';
import { createWalletAccount } from './account';
import { PrivateKey } from 'symbol-sdk';
import { SymbolFacade } from 'symbol-sdk/symbol';
import { createNetworkMap } from './helper';
import { transactionToSymbol } from './transaction-to-symbol';

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
