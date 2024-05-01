import SafeEventEmitter from '@metamask/safe-event-emitter';
import { PersistentStorage } from '@/storage';
import { config } from '@/config';
import { ExtensionPermissions } from '@/constants';

export class WalletController extends SafeEventEmitter {
    static getRequests = async (ids) => {
        return PersistentStorage.getRequestQueue();
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

    static addAccountPermission = async (origin) => {
        return WalletController.addPermission(origin, ExtensionPermissions.account);
    }

    static getPermissions = async () => {
        console.log('getPermissions')
        return PersistentStorage.getPermissions();
    }

    static addPermission = async (origin, permission) => {
        console.log('addPermission', origin, permission)

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
        console.log('removePermission', origin, permission)
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
        console.log('hasPermission', origin, permission)
        const permissions = await PersistentStorage.getPermissions();

        if (!permissions[origin]) {
            return false;
        }

        return permissions[origin].some(includedPermission => includedPermission === permission);
    }
}
