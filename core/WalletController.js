import SafeEventEmitter from '@metamask/safe-event-emitter';
import { PersistentStorage } from '@/storage';
import { config } from '@/config';

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
}
