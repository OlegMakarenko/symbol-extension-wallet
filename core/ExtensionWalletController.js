import { PersistentStorage } from '@/storage';
import { config } from '@/config';
import { ExtensionPermissions } from '@/constants';
import { networkIdentifierToNetworkType } from '@/utils/network';
import { v4 as uuid } from 'uuid';

export class ExtensionWalletController  {
    static getAccountInfo = async () => {
        const networkIdentifier = await PersistentStorage.getNetworkIdentifier();
        const networkType = networkIdentifierToNetworkType(networkIdentifier);
        const publicKey = await PersistentStorage.getCurrentAccountPublicKey();

        return {
            networkType,
            publicKey
        }
    }

    static getNetworkProperties = async () => {
        return PersistentStorage.getNetworkProperties();
    }

    static getActionRequests = async () => {
        return PersistentStorage.getRequestQueue();
    }

    static addActionRequest = async (sender, method, payload) => {
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

    static removeExpiredActionRequests = async ()  => {
        const currentTimestamp = Date.now();
        const requests = await PersistentStorage.getRequestQueue();
        const expiredRequests = requests.filter(request =>
            !request.timestamp ||
            (request.timestamp  + config.actionRequestDeadline) <= currentTimestamp);
        const expiredRequestsIds = expiredRequests.map(request => request.id);

        this.removeActionRequests(expiredRequestsIds);
    }

    static removeActionRequests = async (ids) => {
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

    static listenNetworkProperties = async (onChange) => {
        return PersistentStorage.listen(PersistentStorage.NETWORK_PROPERTIES_KEY, onChange);
    }
    static listenCurrentAccount = async (onChange) => {
        return PersistentStorage.listen(PersistentStorage.CURRENT_ACCOUNT_PUBLIC_KEY, onChange);
    }

    static removeListener = async (listener) => {
        PersistentStorage.removeListener(listener);
    }

    static isAppLaunchEnabled = async () => {
        const mode = await PersistentStorage.getAppLaunchMode();

        return mode === 'home' || mode === 'confirm';
    }

    static isAppLaunchWithConfirmEnabled = async () => {
        const mode = await PersistentStorage.getAppLaunchMode();

        return mode === 'confirm';
    }

    static setAppLaunchMode = async (value) => {
        return PersistentStorage.setAppLaunchMode(value);
    }

    static getAppLaunchMode = async () => {
        return PersistentStorage.getAppLaunchMode();
    }
}
