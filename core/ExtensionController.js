import ObjectMultiplex from 'obj-multiplex';
import { EXTENSION_MESSAGES, ExtensionPermissions, ExtensionRpcMethods, ProviderEvents, StreamName } from '@/constants';
import pump from 'pump';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { WalletController } from './WalletController';
import { networkPropertiesToChainInfo } from '@/utils/network';

const MAX_OPEN_POPUPS = 1;
export class ExtensionController {
    constructor(ops) {
        this.extension = ops.browser;
        this.openPopupIds = [];
        this.connections = {};

        this.extension.windows.onRemoved.addListener((closedPopupId) => {
            this.openPopupIds = this.openPopupIds.filter(popupId => popupId !== closedPopupId);
        });

        WalletController.listenNetworkProperties((value) => {
            const chainInfo = networkPropertiesToChainInfo(value);
            this._notifyProvider(ProviderEvents.chainChanged, chainInfo);
        })
        WalletController.listenCurrentAccount(() => {
            this._notifyProvider(ProviderEvents.accountChanged);
        })
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

        // setup multiplexing
        const mux = new ObjectMultiplex();
        mux.ignoreStream(EXTENSION_MESSAGES.CONNECTION_READY);
        pump(connectionStream, mux, connectionStream, () => {
            delete this.connections[sender.documentId];
        });

        // connect features
        const outStream = mux.createStream(StreamName.PROVIDER);
        this.connections[sender.documentId] = outStream;

        connectionStream.on('data', data => this._handleMessage(data, senderInfo, outStream));
    }

    _notifyProvider = (eventName, data) => {
        Object.values(this.connections).forEach(connection => connection.write({
            event: {
                type: eventName,
                data
            }
        }));
    }

    _handleMessage = async (message, senderInfo, outStream) => {
        try {
            const { method, params } = message.data;
            const api = this.getApi();


            if (!api[method]) {
                throw Error(`Method "${method}" is unsupported`);
            }

            const result = await api[method](senderInfo, ...params);
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
            [ExtensionRpcMethods.getAccountInfo]: this.getAccountInfo,
            [ExtensionRpcMethods.getChainInfo]: this.getChainInfo,
            [ExtensionRpcMethods.getPermissions]: this.getPermissions
        };
    }

    requestTransaction = async (sender, transactionPayload) => {
        const method = ExtensionRpcMethods.requestTransaction;
        const payload = {
            transactionPayload
        };
        await WalletController.addRequest(sender, method, payload);

        this.openWalletPopup();
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

        const method = ExtensionRpcMethods.requestPermission;
        const payload = permission;
        await WalletController.addRequest(sender, method, payload);

        this.openWalletPopup();
    }

    getAccountInfo = async (sender) => {
        const isPermissionGranted = await WalletController.hasPermission(sender.origin, ExtensionPermissions.accountInfo);

        if (!isPermissionGranted) {
            throw Error('No permission')
        }

        return WalletController.getAccountInfo();
    }

    getPermissions = async (sender) => {
        const allPermissions = await WalletController.getPermissions();
        const originPermissions = allPermissions[sender.origin];

        return originPermissions || [];
    }

    getChainInfo = async () => {
        const networkProperties = await WalletController.getNetworkProperties();

        return networkPropertiesToChainInfo(networkProperties);
    }

    openWalletPopup = async () => {
        if (this.openPopupIds.length >= MAX_OPEN_POPUPS) {
            return;
        }

        const isAppLaunchAllowed = await WalletController.isExternalAppLaunchEnabled();

        if (!isAppLaunchAllowed) {
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

        this.extension.action.setBadgeText({ text: label });
        this.extension.action.setBadgeBackgroundColor({ color: '#037DD6' });
    }
}
