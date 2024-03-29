import { config } from '@/config';
import { AccountService, MosaicService } from '@/services';
import { PersistentStorage, SecureStorage } from '@/storage';
import { createWalletAccount } from '@/utils/account';
import { createNetworkMap } from '@/utils/helper';
import { getMosaicRelativeAmount, getNativeMosaicAmount } from '@/utils/mosaic';
import { generateSeedAccounts } from '@/utils/wallet';

export default {
    namespace: 'wallet',
    state: {
        isReady: false, // wether the wallet is ready to fetch any data (network props and cache is loaded)
        accounts: {
            // all accounts added to the wallet
            mainnet: [],
            testnet: [],
        },
        seedAddresses: {
            // all (count specified in config) wallet seed addresses
            mainnet: [],
            testnet: [],
        },
        balances: {}, // account balances by address
        mosaicInfos: {
            // mosaic infos (name, divisibility, etc.)
            mainnet: {},
            testnet: {},
        },
        selectedAccountId: null, // selected wallet account by user
    },
    mutations: {
        setReady(state, payload) {
            state.wallet.isReady = payload;
            return state;
        },
        setAccounts(state, payload) {
            state.wallet.accounts = payload;
            return state;
        },
        setSeedAddresses(state, payload) {
            state.wallet.seedAddresses = payload;
            return state;
        },
        setBalances(state, payload) {
            state.wallet.balances = payload;
            return state;
        },
        setMosaicInfos(state, payload) {
            state.wallet.mosaicInfos = payload;
            return state;
        },
        setSelectedAccountId(state, payload) {
            state.wallet.selectedAccountId = payload;
            return state;
        },
    },
    actions: {
        // Load data from cache in all modules
        loadAll: async ({ dispatchAction }) => {
            await dispatchAction({ type: 'wallet/loadState' });
            await dispatchAction({ type: 'network/loadState' });
            await dispatchAction({ type: 'account/loadState' });
            await dispatchAction({ type: 'transaction/loadState' });
            await dispatchAction({ type: 'market/loadState' });
        },
        // Fetch latest data from API in all modules
        fetchAll: async ({ dispatchAction }) => {
            await dispatchAction({ type: 'network/fetchData' });
            await dispatchAction({ type: 'account/fetchData' });
            await dispatchAction({ type: 'transaction/fetchData', payload: {} });
            await dispatchAction({ type: 'market/fetchData' });
        },
        // Load data from cache or set an empty values
        loadState: async ({ commit }) => {
            const seedAddresses = await PersistentStorage.getSeedAddresses();
            const balances = await PersistentStorage.getBalances();
            const mosaicInfos = await PersistentStorage.getMosaicInfos();
            const selectedAccountId = await PersistentStorage.getCurrentAccountPublicKey();

            commit({ type: 'wallet/setSeedAddresses', payload: seedAddresses });
            commit({ type: 'wallet/setBalances', payload: balances });
            commit({ type: 'wallet/setMosaicInfos', payload: mosaicInfos });
            commit({ type: 'wallet/setSelectedAccountId', payload: selectedAccountId || 0 });
        },
        // Save mnemonic to wallet. Generate seed accounts for all networks
        saveMnemonic: async ({ commit, dispatchAction }, { mnemonic, password }) => {
            // Save mnemonic and verify it is stored correctly
            let savedMnemonic;
            await SecureStorage.setMnemonic(mnemonic, password);
            savedMnemonic = await SecureStorage.getMnemonic(password);
            if (mnemonic !== savedMnemonic) {
                throw Error('error_mnemonic_does_not_match');
            }

            // Generate and save seed accounts
            const accounts = await generateSeedAccounts(mnemonic);
            await SecureStorage.setAccounts(accounts, password);
            commit({ type: 'wallet/setAccounts', payload: accounts });

            // Select first account of the default network
            const defaultAccount = accounts[config.defaultNetworkIdentifier][0];
            await dispatchAction({ type: 'wallet/selectAccount', payload: defaultAccount.publicKey });
        },
        // Load accounts into the store
        loadAccounts: async ({ commit }, password) => {
            const storedAccounts = await SecureStorage.getAccounts(password);
            const walletAccounts = createNetworkMap((networkIdentifier) => storedAccounts[networkIdentifier]
                .map(account => createWalletAccount(
                    account.privateKey,
                    account.networkIdentifier,
                    account.name,
                    account.accountType,
                    account.index
                ))
            );
            commit({ type: 'wallet/setAccounts', payload: walletAccounts });

        },
        // Set selected account private key
        selectAccount: async ({ commit }, publicKey) => {
            await PersistentStorage.setCurrentAccountPublicKey(publicKey);
            commit({ type: 'wallet/setSelectedAccountId', payload: publicKey });
        },
        // Add seed account to wallet
        addSeedAccount: async ({ commit, dispatchAction, state }, { index, name, networkIdentifier }) => {
            const { mnemonic } = state.wallet;
            const accountType = 'seed';
            const privateKeys = createPrivateKeysFromMnemonic(mnemonic, [index], networkIdentifier);
            const privateKey = privateKeys[0];
            const walletAccount = createWalletAccount(privateKey, networkIdentifier, name, accountType, index);
            const accounts = await SecureStorage.getAccounts();
            const networkAccounts = accounts[networkIdentifier];
            const isAccountAlreadyExists = networkAccounts.find((account) => account.index === index);

            if (isAccountAlreadyExists) {
                throw Error('error_failed_add_account_already_exists');
            }

            networkAccounts.push(walletAccount);

            await SecureStorage.setAccounts(accounts);
            commit({ type: 'wallet/setAccounts', payload: accounts });

            await dispatchAction({ type: 'wallet/selectAccount', payload: privateKey });
        },
        // Add external (private key) account to wallet
        addExternalAccount: async ({ commit, dispatchAction }, { privateKey, name, networkIdentifier }) => {
            const accountType = 'external';
            const walletAccount = createWalletAccount(privateKey, networkIdentifier, name, accountType, null);
            const accounts = await SecureStorage.getAccounts();
            const networkAccounts = accounts[networkIdentifier];
            const isAccountAlreadyExists = networkAccounts.find((account) => account.privateKey === privateKey);

            if (isAccountAlreadyExists) {
                throw Error('error_failed_add_account_already_exists');
            }

            networkAccounts.push(walletAccount);

            await SecureStorage.setAccounts(accounts);
            commit({ type: 'wallet/setAccounts', payload: accounts });

            await dispatchAction({ type: 'wallet/selectAccount', payload: privateKey });
        },
        // Remove account to wallet
        removeAccount: async ({ commit }, { privateKey, networkIdentifier }) => {
            const accounts = await SecureStorage.getAccounts();
            accounts[networkIdentifier] = accounts[networkIdentifier].filter((account) => account.privateKey !== privateKey);

            await SecureStorage.setAccounts(accounts);
            commit({ type: 'wallet/setAccounts', payload: accounts });
        },
        // Rename wallet account
        renameAccount: async ({ commit }, { publicKey, networkIdentifier, name, password }) => {
            const accounts = await SecureStorage.getAccounts(password);
            const account = accounts[networkIdentifier].find((account) => account.publicKey == publicKey);
            account.name = name;

            await SecureStorage.setAccounts(accounts, password);
            commit({ type: 'wallet/setAccounts', payload: accounts });
        },
        // Fetch and cache account balance by address
        fetchBalance: async ({ commit, state }, address) => {
            const { networkProperties } = state.network;
            const balances = await PersistentStorage.getBalances();
            let balance;
            try {
                const accountInfo = await AccountService.fetchAccountInfo(networkProperties, address);
                const accountMosaics = accountInfo.mosaics;
                const absoluteAmount = getNativeMosaicAmount(accountMosaics, networkProperties.networkCurrency.mosaicId);
                balance = getMosaicRelativeAmount(absoluteAmount, networkProperties.networkCurrency.divisibility);
            } catch (error) {
                if (error.message === 'error_fetch_not_found') {
                    balance = 0;
                } else {
                    console.error(error);
                    throw Error('error_fetch_balance');
                }
            }
            const addressBalance = {
                [address]: balance,
            };
            const updatedBalances = { ...balances, ...addressBalance };
            await PersistentStorage.setBalances(updatedBalances);

            commit({ type: 'wallet/setBalances', payload: updatedBalances });
        },
        // Fetch and cache mosaic infos
        fetchMosaicInfos: async ({ commit, state }, mosaicIds) => {
            const { networkProperties, networkIdentifier } = state.network;
            const mosaicInfos = await PersistentStorage.getMosaicInfos();

            try {
                const fetchedMosaicInfos = await MosaicService.fetchMosaicInfos(networkProperties, mosaicIds);
                mosaicInfos[networkIdentifier] = {
                    ...mosaicInfos[networkIdentifier],
                    ...fetchedMosaicInfos,
                };
            } catch (error) {
                throw Error('error_fetch_mosaic_infos');
            }

            await PersistentStorage.setMosaicInfos(mosaicInfos);
            commit({ type: 'wallet/setMosaicInfos', payload: mosaicInfos });
        },
    },
};
