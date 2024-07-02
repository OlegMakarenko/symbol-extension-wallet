import * as encryptorUtils from '@metamask/browser-passworder';
import { PersistentStorage } from './PersistentStorage';

export class SecureStorage {
    // Keys
    static MNEMONIC_KEY = 'MNEMONIC';
    static ACCOUNTS_KEY = 'ACCOUNTS';

    // Mnemonic
    static getMnemonic(password) {
        return this.get(this.MNEMONIC_KEY, password);
    }

    static getMnemonicEncrypted() {
        return this.getEncrypted(this.MNEMONIC_KEY);
    }

    static setMnemonic(payload, password) {
        return this.set(this.MNEMONIC_KEY, payload, password);
    }

    // Accounts
    static async getAccounts(password) {
        const defaultAccounts = {
            mainnet: [],
            testnet: [],
        };
        const accounts = await this.get(this.ACCOUNTS_KEY, password);

        try {
            return JSON.parse(accounts) || defaultAccounts;
        } catch {
            return defaultAccounts;
        }
    }

    static getAccountsEncrypted() {
        return this.getEncrypted(this.ACCOUNTS_KEY);
    }

    static async setAccounts(payload, password) {
        return this.set(this.ACCOUNTS_KEY, JSON.stringify(payload), password);
    }

    // API
    static get = async (key, password) => {
        try {
            const encryptedValue = await PersistentStorage.get(key);

            if (encryptedValue === null) {
                return null;
            }

            return encryptorUtils.decrypt(password, encryptedValue)
        } catch {
            return null;
        }
    };

    static getEncrypted = async (key) => {
        return PersistentStorage.get(key);
    };

    static set = async (key, value, password) => {
        const encryptedValue = await encryptorUtils.encrypt(password, value);

        return PersistentStorage.set(key, encryptedValue);
    };


    static removeAll = async () => {
        await PersistentStorage.remove(this.MNEMONIC_KEY);
        await PersistentStorage.remove(this.ACCOUNTS_KEY);
    };
}
