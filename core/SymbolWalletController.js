import SafeEventEmitter from '@metamask/safe-event-emitter';
import ObjectMultiplex from 'obj-multiplex';
import { EXTENSION_MESSAGES, StreamName } from '@/constants';
import pump from 'pump';

export class SymbolWalletController extends SafeEventEmitter {
    constructor(ops) {
        super();

        this.extension = ops.browser;
        this.tabs = {};
    }

    setupMultiplex(connectionStream) {
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
    setupCommunication(connectionStream, sender) {
        // setup multiplexing
        const mux = this.setupMultiplex(connectionStream);

        // connect features
        const outStream = mux.createStream(StreamName.PROVIDER);
        const tabId = sender.tab.id;
        this.tabs[tabId] = {
            outStream,
            extensionId: sender.id
        };

        connectionStream.on('data', data => this._handleMessage(data, tabId))
    }

    _handleMessage(message, tabId) {
        console.log(`New message from ${tabId}`, message)
    }
}
