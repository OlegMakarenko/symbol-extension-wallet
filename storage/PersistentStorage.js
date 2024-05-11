import _ from 'lodash';

export class PersistentStorage {
    // Keys
    static DATA_SCHEMA_VERSION = 'DATA_SCHEMA_VERSION';
    static NETWORK_IDENTIFIER_KEY = 'NETWORK_IDENTIFIER';
    static SELECTED_NODE_KEY = 'selectedNode';
    static CURRENT_ACCOUNT_PUBLIC_KEY = 'CURRENT_ACCOUNT_PUBLIC_KEY';
    static SELECTED_LANGUAGE_KEY = 'SELECTED_LANGUAGE';
    static SEED_ADDRESSES_KEY = 'seedAddresses';
    static BALANCES_KEY = 'balances';
    static LATEST_TRANSACTIONS_KEY = 'latestTransactions';
    static MOSAIC_INFOS_KEY = 'mosaicInfos';
    static ACCOUNT_INFOS_KEY = 'accountInfos';
    static USER_CURRENCY_KEY = 'USER_CURRENCY_KEY';
    static REQUEST_KEY = 'REQUEST';
    static PERMISSIONS_KEY = 'PERMISSIONS';
    static NETWORK_PROPERTIES_KEY = 'NETWORK_PROPERTIES_KEY';

    // Data Schema Version
    static getDataSchemaVersion = async () => {
        const version = await this.get(this.DATA_SCHEMA_VERSION);

        if (version === null) {
            return null;
        }

        return parseInt(version);
    };

    static setDataSchemaVersion = (payload) => {
        return this.set(this.DATA_SCHEMA_VERSION, payload.toString());
    };

    // Network Identifier
    static getNetworkIdentifier = async () => {
        const networkIdentifier = (await this.get(this.NETWORK_IDENTIFIER_KEY)) || 'mainnet';

        try {
            return JSON.parse(networkIdentifier);
        } catch {
            return 'mainnet';
        }
    };

    static setNetworkIdentifier = (payload) => {
        return this.set(this.NETWORK_IDENTIFIER_KEY, JSON.stringify(payload));
    };

    // Selected Node
    static getSelectedNode = async () => {
        const nodeUrl = await this.get(this.SELECTED_NODE_KEY);
        return nodeUrl === 'null' ? null : nodeUrl;
    };

    static setSelectedNode = (payload) => {
        const nodeUrl = payload === null ? 'null' : payload;
        return this.set(this.SELECTED_NODE_KEY, nodeUrl);
    };

    // Current Account Public Key
    static getCurrentAccountPublicKey = () => {
        return this.get(this.CURRENT_ACCOUNT_PUBLIC_KEY);
    };

    static setCurrentAccountPublicKey = (payload) => {
        return this.set(this.CURRENT_ACCOUNT_PUBLIC_KEY, payload);
    };


    // Selected Language
    static getSelectedLanguage = () => {
        return this.get(this.SELECTED_LANGUAGE_KEY);
    };

    static setSelectedLanguage = (payload) => {
        return this.set(this.SELECTED_LANGUAGE_KEY, payload);
    };

        // Seed Addresses
        static async getSeedAddresses() {
            const addresses = await this.get(this.SEED_ADDRESSES_KEY);
            const defaultAccounts = {
                mainnet: [],
                testnet: [],
            };

            try {
                return JSON.parse(addresses) || defaultAccounts;
            } catch {
                return defaultAccounts;
            }
        }

        static async setSeedAddresses(payload) {
            return this.set(this.SEED_ADDRESSES_KEY, JSON.stringify(payload));
        }

        // Balances
        static async getBalances() {
            const balances = await this.get(this.BALANCES_KEY);
            const defaultBalances = {};

            try {
                return JSON.parse(balances) || defaultBalances;
            } catch {
                return defaultBalances;
            }
        }

        static async setBalances(payload) {
            return this.set(this.BALANCES_KEY, JSON.stringify(payload));
        }

        // Transactions
        static async getLatestTransactions() {
            const latestTransactions = await this.get(this.LATEST_TRANSACTIONS_KEY);
            const defaultLatestTransactions = {};

            try {
                return JSON.parse(latestTransactions) || defaultLatestTransactions;
            } catch {
                return defaultLatestTransactions;
            }
        }

        static async setLatestTransactions(payload) {
            return this.set(this.LATEST_TRANSACTIONS_KEY, JSON.stringify(payload));
        }

        // Mosaic Infos
        static async getMosaicInfos() {
            const mosaicInfos = await this.get(this.MOSAIC_INFOS_KEY);
            const defaultMosaicInfos = {
                mainnet: {},
                testnet: {},
            };

            try {
                return JSON.parse(mosaicInfos) || defaultMosaicInfos;
            } catch {
                return defaultMosaicInfos;
            }
        }

        static async setMosaicInfos(payload) {
            return this.set(this.MOSAIC_INFOS_KEY, JSON.stringify(payload));
        }

        // Account Infos
        static async getAccountInfos() {
            const accountInfos = await this.get(this.ACCOUNT_INFOS_KEY);
            const defaultAccountInfos = {};

            try {
                return JSON.parse(accountInfos) || defaultAccountInfos;
            } catch {
                return defaultAccountInfos;
            }
        }

        static async setAccountInfos(payload) {
            return this.set(this.ACCOUNT_INFOS_KEY, JSON.stringify(payload));
        }

    // User Currency
    static async getUserCurrency() {
        const value = await this.get(this.USER_CURRENCY_KEY);
        const defaultValue = 'USD';

        return value || defaultValue;
    }

    static async setUserCurrency(payload) {
        return this.set(this.USER_CURRENCY_KEY, payload);
    }

    // Request Action
    static async getRequestQueue() {
        const value = await this.get(this.REQUEST_KEY);
        const defaultValue = [];

        try {
            const parsedValue = JSON.parse(value);
            return _.isArray(parsedValue) ? parsedValue : defaultValue;
        } catch {
            return defaultValue;
        }
    }

    static async setRequestQueue(payload) {
        return this.set(this.REQUEST_KEY, JSON.stringify(payload));
    }

    // Permissions
    static async getPermissions() {
        const value = await this.get(this.PERMISSIONS_KEY);
        const defaultValue = {};

        try {
            return JSON.parse(value) || defaultValue;
        } catch {
            return defaultValue;
        }
    }

    static async setPermissions(payload) {
        return this.set(this.PERMISSIONS_KEY, JSON.stringify(payload));
    }

    // Network Properties
    static async getNetworkProperties() {
        const value = await this.get(this.NETWORK_PROPERTIES_KEY);
        const defaultValue = {};

        try {
            return JSON.parse(value) || defaultValue;
        } catch {
            return defaultValue;
        }
    }

    static async setNetworkProperties(payload) {
        return this.set(this.NETWORK_PROPERTIES_KEY, JSON.stringify(payload));
    }

    // API
    static set = async (key, value) => {
        if (chrome?.storage?.local)
            return chrome.storage.local.set({[key]: value});
        else
            return localStorage.setItem(key, value);
    };

    static get = async (key) => {
        if (chrome?.storage?.local) {
            return (await chrome.storage.local.get(key))[key];
        }
        else
            return localStorage.getItem(key);
    };

    static remove = (key) => {
        if (chrome?.storage?.local) {
            return chrome.storage.local.remove(key);
        }
        else
            return localStorage.removeItem(key);
    };

    static removeAll = async () => {
        await Promise.all([
            this.remove(this.DATA_SCHEMA_VERSION),
            this.remove(this.NETWORK_IDENTIFIER_KEY),
            this.remove(this.CURRENT_ACCOUNT_PUBLIC_KEY),
            this.remove(this.SELECTED_NODE_KEY),
            this.remove(this.SELECTED_LANGUAGE_KEY),
            this.remove(this.SEED_ADDRESSES_KEY),
            this.remove(this.BALANCES_KEY),
            this.remove(this.LATEST_TRANSACTIONS_KEY),
            this.remove(this.MOSAIC_INFOS_KEY),
            this.remove(this.ACCOUNT_INFOS_KEY),
            this.remove(this.USER_CURRENCY_KEY),
            this.remove(this.REQUEST_KEY),
            this.remove(this.PERMISSIONS_KEY),
            this.remove(this.NETWORK_PROPERTIES_KEY),
        ]);
    };

    static listen = (key, onChange) => {
        const listener = (changes) => {
            if (changes[key]) {
                onChange(changes[key].newValue);
            }
        }

        PersistentStorage.addListener(listener);

        return listener;
    }

    static addListener = (callback) => {
        chrome.storage.onChanged.addListener(callback);
    }

    static removeListener = (callback) => {
        chrome.storage.onChanged.removeListener(callback);
    }
}
