import { PrivateKey, PublicKey } from 'symbol-sdk';
import { SymbolFacade, Address } from 'symbol-sdk/symbol';

export const generateKeyPair = () => {
    const privateKey = PrivateKey.random();
    const keyPair = new SymbolFacade.KeyPair(privateKey);

    return {
        privateKey: privateKey.toString(),
        publicKey: keyPair.publicKey.toString(),
    };
};

export const addressFromPrivateKey = (privateKey, networkIdentifier) => {
    return publicAccountFromPrivateKey(privateKey, networkIdentifier).address;
};

export const addressFromPublicKey = (publicKey, networkIdentifier) => {
    const facade = new SymbolFacade(networkIdentifier);
    const _publicKey = new PublicKey(publicKey);

    return facade.network.publicKeyToAddress(_publicKey).toString();
};

export const publicAccountFromPrivateKey = (privateKey, networkIdentifier) => {
    const facade = new SymbolFacade(networkIdentifier);
    const _privateKey = new PrivateKey(privateKey);
    const keyPair = new SymbolFacade.KeyPair(_privateKey);
    const address = facade.network.publicKeyToAddress(keyPair.publicKey);

    return {
        address: address.toString(),
        publicKey: keyPair.publicKey.toString(),
    }
};

export const createWalletAccount = (privateKey, networkIdentifier, name, accountType, index) => {
    const publicAccount = publicAccountFromPrivateKey(privateKey, networkIdentifier);

    return {
        address: publicAccount.address,
        publicKey: publicAccount.publicKey,
        name,
        networkIdentifier,
        accountType,
        index: index === null || index === undefined ? null : index,
    };
};

export const createWalletStorageAccount = (privateKey, networkIdentifier, name, accountType, index) => {
    return {
        ...createWalletAccount(privateKey, networkIdentifier, name, accountType, index),
        privateKey
    };
};

export const isPublicOrPrivateKey = (stringToTest) => {
    return typeof stringToTest === 'string' && stringToTest.length === 64;
};

export const isSymbolAddress = (address) => {
    if (typeof address !== 'string') {
        return false;
    }

    const addressTrimAndUpperCase = address.trim().toUpperCase().replace(/-/g, '');

    if (addressTrimAndUpperCase.length !== 39) {
        return false;
    }

    if (addressTrimAndUpperCase.charAt(0) !== 'T' && addressTrimAndUpperCase.charAt(0) !== 'N') {
        return false;
    }

    return true;
};

export const addressFromRaw = (rawAddress) => {
    return new Address(Buffer.from(rawAddress, 'hex')).toString()
};
