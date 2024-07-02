import { PersistentStorage, SecureStorage } from '@/storage';
import { config } from '@/config';
import { WalletEventNames, ExtensionPermissions } from '@/constants';
import { networkIdentifierToNetworkType } from '@/utils/network';
import { v4 as uuid } from 'uuid';

export class WalletController  {
    static getAccountInfo = async () => {
        const networkIdentifier = await PersistentStorage.getNetworkIdentifier();
        const networkType = networkIdentifierToNetworkType(networkIdentifier);
        const publicKey = await PersistentStorage.getCurrentAccountPublicKey();

        return {
            networkType,
            publicKey
        }
    }

    static getRequests = async () => {
        return PersistentStorage.getRequestQueue();
    }

    static addRequest = async (sender, method, payload) => {
        const requests = await PersistentStorage.getRequestQueue();
        requests.push({
            sender,
            method,
            payload,
            timestamp: Date.now(),
            id: uuid(),
        });
        await PersistentStorage.setRequestQueue(requests);
    }

    static removeExpiredRequests = async ()  => {
        const currentTimestamp = Date.now();
        const requests = await PersistentStorage.getRequestQueue();
        const expiredRequests = requests.filter(request =>
            !request.timestamp ||
            (request.timestamp  + config.actionRequestDeadline) <= currentTimestamp);
        const expiredRequestsIds = expiredRequests.map(request => request.id);

        this.removeRequests(expiredRequestsIds);
    }

    static removeRequests = async (ids) => {
        const requests = await PersistentStorage.getRequestQueue();
        const updatedRequests = requests.filter(request => !ids.some(id => id === request.id));

        await PersistentStorage.setRequestQueue(updatedRequests);
    }

    static getPermissions = async () => {
        return PersistentStorage.getPermissions();
    }

    static addPermission = async (origin, permission) => {
        const isPermissionSupported = Object.values(ExtensionPermissions).some(item => item === permission);

        if (!isPermissionSupported) {
            throw Error('Invalid permission');
        }

        const permissions = await PersistentStorage.getPermissions();

        if (!permissions[origin]) {
            permissions[origin] = [];
        }

        const isPermissionAlreadyGranted = permissions[origin].some(includedPermission => includedPermission === permission)

        if (isPermissionAlreadyGranted) {
            return;
        }

        permissions[origin].push(permission)

        await PersistentStorage.setPermissions(permissions);
    }

    static removePermission = async (origin, permission) => {
        const permissions = await PersistentStorage.getPermissions();

        if (!permissions[origin]) {
            return;
        }

        const updatedPermissions = permissions[origin].filter(includedPermission => includedPermission !== permission);

        permissions[origin] = updatedPermissions;

        if (!permissions[origin].length) {
            delete permissions[origin];
        }

        await PersistentStorage.setPermissions(permissions);
    }

    static hasPermission = async (origin, permission) => {
        const permissions = await PersistentStorage.getPermissions();

        if (!permissions[origin]) {
            return false;
        }

        return permissions[origin].some(includedPermission => includedPermission === permission);
    }

    static setNetworkProperties = async (networkProperties) => {
        return PersistentStorage.setNetworkProperties(networkProperties);
    }

    static getNetworkProperties = async () => {
        return PersistentStorage.getNetworkProperties();
    }

    static listenNetworkProperties = async (onChange) => {
        return PersistentStorage.listen(PersistentStorage.NETWORK_PROPERTIES_KEY, onChange);
    }
    static listenCurrentAccount = async (onChange) => {
        return PersistentStorage.listen(PersistentStorage.CURRENT_ACCOUNT_PUBLIC_KEY, onChange);
    }

    static removeListener = async (listener) => {
        PersistentStorage.removeListener(listener);
    }

    static logoutAndClearStorage = async () => {
        await SecureStorage.removeAll();
        await PersistentStorage.removeAll();
        document.dispatchEvent(new CustomEvent(WalletEventNames.LOGOUT));
    }

    static isMnemonicStored = async () => {
        return !!(await SecureStorage.getMnemonicEncrypted());
    }

    static isRequestAutoOpenEnabled = async () => {
        const mode = await PersistentStorage.getRequestAutoOpen();

        return mode === 'confirm';
    }

    static isExternalAppLaunchEnabled = async () => {
        const mode = await PersistentStorage.getRequestAutoOpen();

        return mode === 'home' || mode === 'confirm';
    }

    static setRequestAutoOpen = async (value) => {
        return PersistentStorage.setRequestAutoOpen(value);
    }

    static getRequestAutoOpen = async () => {
        return PersistentStorage.getRequestAutoOpen();
    }
}
