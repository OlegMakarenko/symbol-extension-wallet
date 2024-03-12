import { ExtendedKey, MnemonicPassPhrase, Network, Wallet } from 'symbol-hd-wallets';
import { createNetworkMap } from './helper';
import { createWalletStorageAccount, publicAccountFromPrivateKey } from './account';
import { DEFAULT_ACCOUNT_NAME, MAX_SEED_ACCOUNTS_PER_NETWORK, WalletAccountType } from '@/constants';
import { optInWhiteList } from '@/config';

export const generateMnemonic = () => {
    return MnemonicPassPhrase.createRandom().plain;
};

export const createPrivateKeysFromMnemonic = (mnemonic, indexes, networkIdentifier, curveType) => {
    const mnemonicPassPhrase = new MnemonicPassPhrase(mnemonic);
    const seed = mnemonicPassPhrase.toSeed().toString('hex');
    const curve = curveType === 'optin' ? Network.BITCOIN : Network.SYMBOL;
    const extendedKey = ExtendedKey.createFromSeed(seed, curve);
    const wallet = new Wallet(extendedKey);

    const privateKeys = indexes.map((index) => {
        const pathTestnet = `m/44'/1'/${index}'/0'/0'`;
        const pathMainnet = `m/44'/4343'/${index}'/0'/0'`;
        const path = networkIdentifier === 'mainnet' ? pathMainnet : pathTestnet;

        return wallet.getChildAccountPrivateKey(path);
    });

    return privateKeys;
};

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
