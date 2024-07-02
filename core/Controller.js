import { cloneDeep, uniqBy } from 'lodash';
import SafeEventEmitter from '@metamask/safe-event-emitter';
import { makeAutoObservable, runInAction } from 'mobx';
import { config } from '@/config';
import { ControllerEventName, WalletAccountType } from '@/constants';
import { AccountService, ListenerService, MarketService, MosaicService, NamespaceService, NetworkService, TransactionService } from '@/services';
import { createWalletAccount, createWalletStorageAccount, isSymbolAddress } from '@/utils/account';
import { createNetworkMap } from '@/utils/helper';
import { getMosaicsWithRelativeAmounts, getNativeMosaicAmount } from '@/utils/mosaic';
import { PersistentStorage, SecureStorage } from '@/storage';
import { generateSeedAccounts } from '@/utils/wallet';
import { filterAllowedTransactions, filterBlacklistedTransactions } from '@/utils/transaction';
import { transactionFromDTO } from '@/utils/dto';

const defaultNetworkProperties = {
    nodeUrl: null, // currently connected node url. Used for fetching the data
    networkIdentifier: null, // currently connected network identifier (e.g. "mainnet", "testnet")
    generationHash: null,
    epochAdjustment: null, // used in date-time calculations (e.g. transaction deadline, timestamp, etc.)
    transactionFees: {
        minFeeMultiplier: null,
        averageFeeMultiplier: null,
    },
    networkCurrency: { // network currency mosaic. By default is "symbol.xym"
        mosaicId: null,
        divisibility: null,
    },
};

const defaultAccountInfo = {
    isLoaded: false,
    isMultisig: false, // wether account is multisig
    cosignatories: [], // if an account is multisig, contains the list of its cosigners
    multisigAddresses: [], // list of multisig addresses which the account is cosignatory of
    balance: 0, // currency mosaic amount
    mosaics: [], // account owned mosaics
    namespaces: [], // account owned namespaces
    importance: 0,
    linkedKeys: {
        linkedPublicKey: null,
        nodePublicKey: null,
        vrfPublicKey: null,
    },
}

const defaultState = {
    isCacheLoaded: false, // whether cached data is loaded from the persistent storage

    // network
    chainHeight: null, // current chain height
    chainListener: null, // listener instance
    networkConnectionTimer: null,
    networkIdentifier: 'mainnet', // selected network
    networkProperties: cloneDeep(defaultNetworkProperties), // network and chain info fetched from currently connected node
    networkStatus: 'initial', // 'offline' 'failed-auto' 'failed-current' 'connected'
    nodeUrls: createNetworkMap(() => []), // node urls available for each network

    // wallet
    accountInfos: createNetworkMap(() => ({})), // account related information. See "defaultAccountInfo"
    currentAccount: null, // selected user account
    currentAccountPublicKey: null, // selected user account public key. Used as an ID
    mosaicInfos: createNetworkMap(() => ({})),
    seedAddresses: createNetworkMap(() => []), // list of seed addresses generated from mnemonic
    walletAccounts: createNetworkMap(() => []), // all user accounts in the wallet

    // transactions
    latestTransactions: createNetworkMap(() => ({})),

    // market data
    userCurrency: null, // user preferred currency to convert XYM amounts,
    marketData: {
        fetchedAt: 0, // timestamp when the market data is fetched
        prices: {}, // market prices for each currency
    },
}

class Controller {
    constructor() {
        this._notificationChannel = new SafeEventEmitter();
        this._state = cloneDeep(defaultState);

        makeAutoObservable(this);
        this._listenStorageChanges();
    }

    // all user accounts in the wallet. Grouped by network
    get accounts() {
        return this._state.walletAccounts;
    }

    // account infos of all the user accounts in the wallet. Grouped by network
    get accountInfos() {
        return this._state.accountInfos;
    }

    // currently selected user account
    get currentAccount() {
        return this._state.currentAccount;
    }

    // currently selected user account information
    get currentAccountInfo() {
        const { accountInfos, currentAccountPublicKey, networkIdentifier } = this._state;
        return accountInfos[networkIdentifier][currentAccountPublicKey] || defaultAccountInfo;
    }

    get currentAccountLatestTransactions() {
        const { latestTransactions, currentAccountPublicKey, networkIdentifier } = this._state;
        return latestTransactions[networkIdentifier][currentAccountPublicKey] || [];
    }

    get walletAccounts() {
        return this._state.walletAccounts;
    }

    get networkIdentifier() {
        return this._state.networkIdentifier
    }

    get networkProperties() {
        const { networkProperties, nodeUrls } = this._state;
        return {
            ...networkProperties,
            nodeUrls: nodeUrls[networkProperties.networkIdentifier]
        };
    }

    get isNetworkConnectionReady() {
        return this.networkStatus === 'connected' && !!this.networkProperties.nodeUrl;
    }

    get isStateReady() {
        return this._state.isCacheLoaded;
    }

    get isWalletReady() {
        return this._state.isCacheLoaded && this.isNetworkConnectionReady;
    }

    get networkStatus() {
        return this._state.networkStatus;
    }

    get ticker() {
        return config.ticker;
    }

    get price() {
        const { marketData, userCurrency } = this._state;

        return {
            value: marketData.prices[userCurrency],
            currency: userCurrency,
        };
    }

    isWalletCreated = async () => {
        return !!(await SecureStorage.getAccountsEncrypted());
    }

    loadCache = async (password) => {
        const [
            accountInfos,
            seedAddresses,
            mosaicInfos,
            currentAccountPublicKey,
            networkIdentifier,
            networkProperties,
            userCurrency,
            latestTransactions
        ] = await Promise.all([
            PersistentStorage.getAccountInfos(),
            PersistentStorage.getSeedAddresses(),
            PersistentStorage.getMosaicInfos(),
            PersistentStorage.getCurrentAccountPublicKey(),
            PersistentStorage.getNetworkIdentifier(),
            PersistentStorage.getNetworkProperties(),
            PersistentStorage.getUserCurrency(),
            PersistentStorage.getLatestTransactions()
        ]);

        this.clearState();
        await this._loadAccounts(password);

        runInAction(() => {
            this._state.accountInfos = accountInfos;
            this._state.seedAddresses = seedAddresses;
            this._state.mosaicInfos = mosaicInfos;
            this._state.currentAccountPublicKey = currentAccountPublicKey;
            this._state.networkIdentifier = networkIdentifier;
            this._state.networkProperties = networkProperties;
            this._state.userCurrency = userCurrency;
            this._state.latestTransactions = latestTransactions;
            this._state.isCacheLoaded = true;
        });

        this._setCurrentAccount(this._state.currentAccountPublicKey);
    }

    _loadAccounts = async (password) => {
        const accounts = await SecureStorage.getAccounts(password);
        const walletAccounts = createNetworkMap((networkIdentifier) => accounts[networkIdentifier]
            .map(account => createWalletAccount(
                account.privateKey,
                account.networkIdentifier,
                account.name,
                account.accountType,
                account.index
            ))
        );

        runInAction(() => {
            this._state.walletAccounts = walletAccounts;
        });
    }

    saveMnemonicAndGenerateAccounts = async ({ mnemonic, name }, password) => {
        // Save mnemonic and verify it is stored correctly
        await SecureStorage.setMnemonic(mnemonic, password);
        const savedMnemonic = await SecureStorage.getMnemonic(password);
        if (mnemonic !== savedMnemonic) {
            this._throwError('error_mnemonic_does_not_match');
        }

        // Generate and save seed accounts
        const accounts = await generateSeedAccounts(mnemonic);
        const addresses = {};

        for (const networkIdentifier of Object.keys(accounts)) {
            addresses[networkIdentifier] = accounts[networkIdentifier]
                .map(account => account.address);
            const account = accounts[networkIdentifier][0];

            await this.addAccount({
                accountType: WalletAccountType.SEED,
                privateKey: account.privateKey,
                name,
                networkIdentifier,
                index: account.index,
            }, password);
        }

        await PersistentStorage.setSeedAddresses(addresses, password);

        // Select first account of the default network
        const defaultAccount = accounts[config.defaultNetworkIdentifier][0];
        await this.selectAccount(defaultAccount.publicKey);
    }

    addAccount = async ({ accountType, privateKey, name, networkIdentifier, index }, password) => {
        const account = createWalletStorageAccount(
            privateKey,
            networkIdentifier,
            name,
            accountType,
            index,
        );
        const accounts = await SecureStorage.getAccounts(password);
        const networkAccounts = accounts[networkIdentifier];
        const isAccountAlreadyExists = networkAccounts.find((account) => account.privateKey === privateKey);

        if (isAccountAlreadyExists) {
            this._throwError('error_failed_add_account_already_exists');
        }

        networkAccounts.push(account);
        await SecureStorage.setAccounts(accounts, password);
        await this._loadAccounts(password);
    }

    renameAccount = async ({ networkIdentifier, publicKey, name }, password) => {
        const accounts = await SecureStorage.getAccounts(password);
        const account = accounts[networkIdentifier].find((account) => account.publicKey == publicKey);
        account.name = name;

        await SecureStorage.setAccounts(accounts, password);
        await this._loadAccounts(password);
        this._setCurrentAccount(this._state.currentAccountPublicKey);
    }

    removeAccount = async ({ networkIdentifier, publicKey }, password) => {
        const accounts = await SecureStorage.getAccounts(password);
        accounts[networkIdentifier] = accounts[networkIdentifier].filter((account) => account.publicKey !== publicKey);

        await SecureStorage.setAccounts(accounts, password);
        await this._loadAccounts(password);

        if (this._state.currentAccountPublicKey === publicKey) {
            await this.selectAccount(this.walletAccounts[networkIdentifier][0].publicKey);
        }
    }

    selectAccount = async (publicKey) => {
        this._setCurrentAccount(publicKey);

        await PersistentStorage.setCurrentAccountPublicKey(publicKey);

        runInAction(() => {
            this._state.currentAccountPublicKey = publicKey;
        });
    }

    _setCurrentAccount = (publicKey) => {
        const { walletAccounts, networkIdentifier } = this._state;
        const currentAccount = walletAccounts[networkIdentifier].find((account) => account.publicKey === publicKey);

        if (!currentAccount) {
            this._throwError('error_wallet_selected_account_missing');
        }

        runInAction(() => {
            this._state.currentAccount = currentAccount;
        });
    }

    fetchAccountInfo = async (publicKey) => {
        const { walletAccounts, networkIdentifier, networkProperties } = this._state;
        const networkAccounts = walletAccounts[networkIdentifier];
        const account = networkAccounts.find((account) => account.publicKey === publicKey);

        if (!account) {
            this._throwError('error_wallet_selected_account_missing');
        }

        const { address } = account;
        let mosaics = [];
        let baseAccountInfo = {};
        try {
            baseAccountInfo = await AccountService.fetchAccountInfo(networkProperties, address);
            mosaics = baseAccountInfo.mosaics;
        } catch (error) {
            if (error.message !== 'error_fetch_not_found') {
                this._throwError('error_fetch_account_info');
            }
        }

        let isMultisig;
        let cosignatories = [];
        let multisigAddresses = [];
        try {
            const multisigInfo = await AccountService.fetchMultisigInfo(networkProperties, address);
            cosignatories = multisigInfo.cosignatories;
            multisigAddresses = multisigInfo.multisigAddresses;
            isMultisig = cosignatories.length > 0;
        } catch {
            isMultisig = false;
        }

        const mosaicIds = mosaics.map((mosaic) => mosaic.id);
        const mosaicInfos = await MosaicService.fetchMosaicInfos(networkProperties, mosaicIds);
        const formattedMosaics = getMosaicsWithRelativeAmounts(mosaics, mosaicInfos);
        const balance = getNativeMosaicAmount(formattedMosaics, networkProperties.networkCurrency.mosaicId)
        const namespaces = await NamespaceService.fetchAccountNamespaces(address, networkProperties);

        const accountInfo = {
            ...defaultAccountInfo,
            isLoaded: true,
            address: baseAccountInfo.address,
            publicKey: baseAccountInfo.publicKey,
            importance: baseAccountInfo.importance,
            linkedKeys: baseAccountInfo.linkedKeys,
            balance,
            mosaics: formattedMosaics,
            namespaces,
            isMultisig,
            cosignatories,
            multisigAddresses
        };
        const accountInfos = await PersistentStorage.getAccountInfos();
        accountInfos[account.networkIdentifier][account.publicKey] = accountInfo;
        await PersistentStorage.setAccountInfos(accountInfos);

        runInAction(() => {
            this._state.accountInfos = accountInfos;
        });
    }

    fetchAccountTransactions = async (publicKey, options = {}) => {
        const { group = 'confirmed', pageNumber = 1, pageSize = 15, filter } = options;
        const { walletAccounts, networkIdentifier, networkProperties } = this._state;
        const blackList = []; // TODO: replace with the address book black list
        const networkAccounts = walletAccounts[networkIdentifier];
        const account = networkAccounts.find((account) => account.publicKey === publicKey);

        // Fetch transactions from chain
        const transactionsDTO = await TransactionService.fetchAccountTransactions(account, networkProperties, { group, filter, pageNumber, pageSize });

        // Resolve addresses, mosaics and namespaces in transactions
        const getUnresolvedIdsFromTransactionDTOs = () => ({ addresses: [], mosaicIds: [], namespaceIds: [] })
        const { addresses, mosaicIds, namespaceIds } = getUnresolvedIdsFromTransactionDTOs(transactionsDTO);
        const mosaicInfos = await MosaicService.fetchMosaicInfos(networkProperties, mosaicIds);
        const namespaceNames = await NamespaceService.fetchNamespaceNames(networkProperties, namespaceIds);
        const resolvedAddresses = await NamespaceService.resolveAddresses(networkProperties, addresses);

        // Format transactions
        const transactionOptions = {
            networkProperties,
            currentAccount: account,
            mosaicInfos,
            namespaceNames,
            resolvedAddresses,
        };
        const transactions = transactionsDTO.map((transactionDTO) => transactionFromDTO(transactionDTO, transactionOptions));

        //Filter transactions
        let filteredTransactions;

        if (filter?.blocked) {
            filteredTransactions = filterBlacklistedTransactions(transactions, blackList);
        } else {
            filteredTransactions = filterAllowedTransactions(transactions, blackList);
        }

        // Cache transactions for current account
        const isFilterActivated = filter && Object.keys(filter).length > 0;
        if (!isFilterActivated && group === 'confirmed') {
            const latestTransactions = await PersistentStorage.getLatestTransactions();
            latestTransactions[networkIdentifier][publicKey] = transactions;
            await PersistentStorage.setLatestTransactions(latestTransactions);
            this._state.latestTransactions = latestTransactions;
        }

        // Return transactions
        return {
            data: filteredTransactions,
            pageNumber
        }
    }

    sendTransferTransaction = async (transaction, password) => {
        const { currentAccount, networkIdentifier, networkProperties } = this;

        // Get current account private key from SecureStorage
        const accounts = await SecureStorage.getAccounts(password);
        const networkAccounts = accounts[networkIdentifier];
        const privateAccount = networkAccounts.find(account => account.publicKey === currentAccount.publicKey);

        const preparedTransaction = {
            type: transaction.type,
            signerPublicKey: currentAccount.publicKey,
            mosaics: transaction.mosaics,
            message: transaction.message,
            fee: transaction.fee,
        };
        const isMultisigTransaction = !!transaction.sender;
        const recipient = transaction.recipientAddress || transaction.recipient;

        // Resolve recipient address
        if (isSymbolAddress(recipient)) {
            preparedTransaction.recipientAddress = recipient;
        } else {
            preparedTransaction.recipientAddress = await NamespaceService.namespaceNameToAddress(
                networkProperties,
                recipient.toLowerCase()
            );
        }

        // If message is encrypted, fetch recipient publicKey
        if (transaction.message?.isEncrypted) {
            const recipientAccount = await AccountService.fetchAccountInfo(
                networkProperties,
                preparedTransaction.recipientAddress
            );
            preparedTransaction.recipientPublicKey = recipientAccount.publicKey;
        }

        // If transaction is multisig, announce Aggregate Bonded
        if (isMultisigTransaction) {
            const senderAccount = await AccountService.fetchAccountInfo(networkProperties, transaction.sender);
            preparedTransaction.signerPublicKey = senderAccount.publicKey;

            const aggregateTransaction = {
                type: TransactionType.AGGREGATE_BONDED,
                signerPublicKey: currentAccount.publicKey,
                fee: transaction.fee,
                innerTransactions: [preparedTransaction]
            }

            await TransactionService.signAndAnnounce(aggregateTransaction, networkProperties, privateAccount);
        }

        // Else, announce Transfer
        await TransactionService.signAndAnnounce(preparedTransaction, networkProperties, privateAccount);
    }

    notifyLoginCompleted = () => {
        this._emit(ControllerEventName.LOGIN);
    }

    logoutAndClearStorage = async () => {
        await SecureStorage.removeAll();
        await PersistentStorage.removeAll();
        this.clearState();
        this._emit(ControllerEventName.LOGOUT);
    }

    clearState = () => {
        this._state = cloneDeep(defaultState);
    }

    fetchMarketData = async () => {
        const { marketData } = this._state;
        const currentTimestamp = Date.now();

        // Fetch new prices if previous market data is unavailable or outdated
        const isOldMarketDataOutdated = currentTimestamp - marketData.fetchedAt > config.allowedMarkedDataCallInterval;

        if (!isOldMarketDataOutdated) {
            return marketData;
        }

        const prices = await MarketService.fetchPrices();

        runInAction(() => {
            this._state.marketData = {
                fetchedAt: currentTimestamp,
                prices,
            };
        });
    }

    selectUserCurrency = async (userCurrency) => {
        await PersistentStorage.setUserCurrency(userCurrency);

        runInAction(() => {
            this._state.userCurrency = userCurrency;
        });
    }

    fetchNodeList = async () => {
        const { networkIdentifier, nodeUrls } = this._state;
        const updatedNodeUrls = { ...nodeUrls };
        updatedNodeUrls[networkIdentifier] = await NetworkService.fetchNodeList(networkIdentifier);

        runInAction(() => {
            this._state.nodeUrls = updatedNodeUrls;
        });

    }

    fetchNetworkProperties = async (nodeUrl) => {
        const networkProperties = await NetworkService.fetchNetworkProperties(nodeUrl);

        if (networkProperties.networkIdentifier !== this.networkIdentifier) {
            throw Error('Requested node is from wrong network');
        }

        await PersistentStorage.setNetworkProperties(networkProperties);

        runInAction(() => {
            this._state.networkProperties = networkProperties;
            this._state.chainHeight = networkProperties.chainHeight;
        });

    }

    selectNetwork = async (networkIdentifier, nodeUrl) => {
        const accounts = this._state.walletAccounts[networkIdentifier];
        await PersistentStorage.setNetworkIdentifier(networkIdentifier);
        await PersistentStorage.setSelectedNode(nodeUrl);

        runInAction(() => {
            this._state.nodeUrls = cloneDeep(defaultState.nodeUrls);
            this._state.networkIdentifier = networkIdentifier;
            this._state.networkProperties = defaultNetworkProperties;
            this._state.chainHeight = 0;
            this._state.networkStatus = 'initial';
        });

        await this.selectAccount(accounts[0].publicKey);
    }

    runConnectionJob = async () => {
        const { networkConnectionTimer, networkIdentifier, networkStatus } = this._state;
        const runAgain = () => {
            const newConnectionTimer = setTimeout(
                () => this.runConnectionJob(),
                config.connectionInterval
            );
            this._state.networkConnectionTimer = newConnectionTimer;
        };

        clearTimeout(networkConnectionTimer);

        if (networkStatus === 'initial') {
            this.fetchNodeList();
        }

        // Try to connect to current node
        if (this.networkProperties.nodeUrl) {
            try {
                await this.fetchNetworkProperties(this.networkProperties.nodeUrl);
                // Node is good.
                runInAction(() => {
                    this._state.networkStatus = 'connected';
                });
                this._startChainListener();
                runAgain();
                return;
            } catch {
                runInAction(() => {
                    this._state.networkStatus = 'failed-current';
                });
            }
        }

        // Try to fetch the node list to verify if it is not the internet connection issue
        try {
            await this.fetchNodeList();
        } catch {
            // Failed to fetch list. Seems like there is an internet connection issue.
            runInAction(() => {
                this._state.networkStatus = 'offline';
            });
            runAgain();
            return;
        }

        // Auto select the node. Try to connect to the node one by one from the list
        for (const nodeUrl of this._state.nodeUrls[networkIdentifier]) {
            try {
                await NetworkService.ping(nodeUrl);
                await this.fetchNetworkProperties(nodeUrl);
                this._startChainListener();
                runInAction(() => {
                    this._state.networkStatus = 'connected';
                });
                runAgain();
                return;
            } catch { }
        }

        runInAction(() => {
            this._state.networkStatus = 'failed-auto';
        });
        runAgain();
        return;
    }

    _startChainListener = async () => {
        this._stopChainListener();

        try {
            const newListener = new ListenerService(this.networkProperties, this.currentAccount);
            await newListener.open();
            newListener.listenTransactions((transaction) => {
                this._emit(ControllerEventName.NEW_TRANSACTION_CONFIRMED, transaction);
            }, 'confirmed')
            newListener.listenTransactions((transaction) => {
                this._emit(ControllerEventName.NEW_TRANSACTION_UNCONFIRMED, transaction);
            }, 'unconfirmed')
            newListener.listenTransactionError((error) => {
                this._emit(ControllerEventName.TRANSACTION_ERROR, error);
            }, 'unconfirmed')
            this._state.chainListener = newListener;
        } catch { }
    }

    _stopChainListener = () => {
        const { chainListener } = this._state;

        if (chainListener) {
            chainListener.close();
        }
    }

    on = (eventName, listener) => {
        this._notificationChannel.on(eventName, listener);
    }

    removeListener = (eventName, listener) => {
        this._notificationChannel.removeListener(eventName, listener);
    }

    _emit = (eventName, payload) => {
        this._notificationChannel.emit(eventName, payload);
    }

    _listenStorageChanges = () => {
        PersistentStorage.listen(PersistentStorage.CURRENT_ACCOUNT_PUBLIC_KEY, async (publicKey) => {
            this._emit(ControllerEventName.ACCOUNT_CHANGE, publicKey);
        });
        PersistentStorage.listen(PersistentStorage.NETWORK_PROPERTIES_KEY, async (networkProperties) => {
            this._emit(ControllerEventName.NETWORK_CHANGE, networkProperties);
        });
    }

    _throwError = (errorType) => {
        this._emit(ControllerEventName.ERROR, errorType);
        throw Error(errorType);
    }
}

export default new Controller();
