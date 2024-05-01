import SafeEventEmitter from '@metamask/safe-event-emitter';
import ObjectMultiplex from 'obj-multiplex';
import { EXTENSION_MESSAGES, ExtensionPermissions, ExtensionRpcMethods, StreamName } from '@/constants';
import pump from 'pump';
import { PersistentStorage } from '@/storage';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { v4 as uuid } from 'uuid';
import { WalletController } from './WalletController';
import { networkIdentifierToNetworkType } from '@/utils/network';

const MAX_OPEN_POPUPS = 1;
export class ExtensionController extends SafeEventEmitter {
    constructor(ops) {
        super();

        this.extension = ops.browser;
        this.tabs = {};
        this.openPopupIds = [];

        this.extension.windows.onRemoved.addListener((closedPopupId) => {
            this.openPopupIds = this.openPopupIds.filter(popupId => popupId !== closedPopupId);
        });
    }

    setupMultiplex = (connectionStream) => {
        const mux = new ObjectMultiplex();
        /**
         * We are using this streams to send keep alive message between backend/ui without setting up a multiplexer
         * We need to tell the multiplexer to ignore them, else we get the " orphaned data for stream " warnings
         * https://github.com/MetaMask/object-multiplex/blob/280385401de84f57ef57054d92cfeb8361ef2680/src/ObjectMultiplex.ts#L63
         */
        mux.ignoreStream(EXTENSION_MESSAGES.CONNECTION_READY);
        pump(connectionStream, mux, connectionStream, (err) => {
            if (err) {
                console.error(err);
            }
        });

        return mux;
    }
    /**
   * Used to create a multiplexed stream for connecting to a trusted context,
   * like our own user interfaces, which have the provider APIs, but also
   * receive the exported API from this controller, which includes trusted
   * functions, like the ability to approve transactions or sign messages.
   *
   * @param {*} connectionStream - The duplex stream to connect to.
   * @param {MessageSender} sender - The sender of the messages on this stream
   */
    setupCommunication = (connectionStream, sender) => {
        const senderInfo = {
            tabId: sender.tab.id,
            origin: sanitizeUrl(sender.origin),
            icon: sanitizeUrl(sender.tab.favIconUrl),
            title: sender.tab.title
        }
        console.log('Communication with', senderInfo)
        // setup multiplexing
        const mux = this.setupMultiplex(connectionStream);

        // connect features
        const outStream = mux.createStream(StreamName.PROVIDER);

        connectionStream.on('data', data => this._handleMessage(data, senderInfo, outStream))
    }

    _handleMessage = async (message, sender, outStream) => {
        try {
            const { method, params } = message.data;
            const api = this.getApi();


            if (!api[method]) {
                throw Error(`Method "${method}" is unsupported`);
            }

            const result = await api[method](sender, ...params);
            outStream.write({
                result,
                id: message.data.id,
            })
        }
        catch (error) {
            console.error(error);
            outStream.write({
                error: {
                    message: error.message,
                },
                id: message.data.id,
            });
        }
    }

    /**
  * Returns an Object containing API Callback Functions.
  * These functions are the interface for the UI.
  * The API object can be transmitted over a stream via JSON-RPC.
  *
  * @returns {object} Object containing API functions.
  */
    getApi = () => {
        return {
            [ExtensionRpcMethods.requestTransaction]: this.requestTransaction,
            [ExtensionRpcMethods.requestPermission]: this.requestPermission,
            [ExtensionRpcMethods.getAccountInfo]: this.getAccountInfo
        };
    }

    requestTransaction = async (sender, transactionPayload) => {
        const requests = await PersistentStorage.getRequestQueue();
        requests.push({
            sender,
            method: ExtensionRpcMethods.requestTransaction,
            payload: {
                transactionPayload
            },
            timestamp: Date.now(),
            id: uuid(),
        });
        await PersistentStorage.setRequestQueue(requests);

        this.openWalletPopup();
    }

    getAccountInfo = async (sender) => {
        const isPermissionGranted = await WalletController.hasPermission(sender.origin, ExtensionPermissions.accountInfo);
        console.log('getAccountInfo', sender.origin, isPermissionGranted)

        if (!isPermissionGranted) {
            throw Error('No permission')
        }

        const networkIdentifier = await PersistentStorage.getNetworkIdentifier();
        const networkType = networkIdentifierToNetworkType(networkIdentifier);
        const publicKey = await PersistentStorage.getCurrentAccountPublicKey();

        return {
            networkType,
            publicKey
        }
    }

    requestPermission = async (sender, permission) => {
        const isPermissionSupported = Object.values(ExtensionPermissions).some(item => item === permission);

        if (!isPermissionSupported) {
            throw Error('Invalid permission');
        }

        const isPermissionAlreadyGranted = await WalletController.hasPermission(sender.origin, permission);

        if (isPermissionAlreadyGranted) {
            return;
        }

        const requests = await PersistentStorage.getRequestQueue();
        requests.push({
            sender,
            method: ExtensionRpcMethods.requestPermission,
            payload: permission,
            timestamp: Date.now(),
            id: uuid(),
        });
        await PersistentStorage.setRequestQueue(requests);

        this.openWalletPopup();
    }

    openWalletPopup = async () => {
        if (this.openPopupIds.length >= MAX_OPEN_POPUPS) {
            return;
        }

        const walletPopup = await this.extension.windows.create({
            url: '/index.html',
            type: 'popup',
            width: 365,
            height: 630,
        });

        this.openPopupIds.push(walletPopup.id);
    }

    /**
     * Updates the Web Extension's "badge" number, on the little fox in the toolbar.
     * The number reflects the current number of pending transactions or message signatures needing user approval.
     */
    updateBadge = (count) => {
        let label = '';

        if (count) {
            label = String(count);
        }

        {
            this.extension.action.setBadgeText({ text: label });
            this.extension.action.setBadgeBackgroundColor({ color: '#037DD6' });
        }
    }
}
