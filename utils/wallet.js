import { createNetworkMap } from './helper';
import { createWalletStorageAccount, publicAccountFromPrivateKey } from './account';
import { DEFAULT_ACCOUNT_NAME, MAX_SEED_ACCOUNTS_PER_NETWORK, WalletAccountType } from '@/constants';
import { optInWhiteList } from '@/config';
import { Bip32 } from 'symbol-sdk';
import { SymbolFacade } from 'symbol-sdk/symbol';

export const generateMnemonic = () => {
    const bip = new Bip32();
    const mnemonic = bip.random();

    return mnemonic.toString();
};

export const createPrivateKeysFromMnemonic = (mnemonic, indexes, networkIdentifier, isOptInCurve) => {
    const facade = new SymbolFacade(networkIdentifier);
    const symbolCurve = facade.static.BIP32_CURVE_NAME;
    const optInCurve = 'secp256k1';
    const curve = isOptInCurve ? optInCurve : symbolCurve;
    const bip = new Bip32(curve);
	const rootNode = bip.fromMnemonic(mnemonic, '');

    const privateKeys = indexes.map((index) => {
        const path = facade.bip32Path(index);
        const childNode = rootNode.derivePath(path);
        const childKeyPair = facade.constructor.bip32NodeToKeyPair(childNode);

        return childKeyPair.privateKey.toString();
    });

    return privateKeys;
}

export const createOptInPrivateKeyFromMnemonic = (mnemonic) => {
    const [optInPrivateKey] = createPrivateKeysFromMnemonic(mnemonic.trim(), [0], 'mainnet', 'optin');
    const optInAccount = publicAccountFromPrivateKey(optInPrivateKey, 'mainnet');
    const isKeyWhitelisted = optInWhiteList.some((publicKey) => publicKey === optInAccount.publicKey);

    return isKeyWhitelisted ? optInPrivateKey : null;
};


export const generateSeedAccounts = async (mnemonic) => {
    const seedIndexes = [...Array(MAX_SEED_ACCOUNTS_PER_NETWORK).keys()];

    return createNetworkMap((networkIdentifier) =>
        createPrivateKeysFromMnemonic(mnemonic, seedIndexes, networkIdentifier)
            .map((privateKey, index) => createWalletStorageAccount(
                privateKey,
                networkIdentifier,
                `${DEFAULT_ACCOUNT_NAME} ${index + 1}`,
                WalletAccountType.SEED,
                index
            ))
    );
}
