import SafeEventEmitter from '@metamask/safe-event-emitter';
import { v4 as uuid } from 'uuid';
import { Duplex, pipeline } from 'readable-stream';
import ObjectMultiplex from 'obj-multiplex';
import { ExtensionRpcMethods, ProviderEvents, StreamName } from '@/constants';

export class InpageProvider extends SafeEventEmitter {
    _log;
    _state;
    _stream;
    _pendingRequests;

    constructor({
        connectionStream,
        logger = console,
        maxEventListeners = 100,
    }) {
        super();
        this.setMaxListeners(maxEventListeners);

        this._state = {
            isConnected: false,
        };
        this._log = logger;
        this._pendingRequests = {};

        connectionStream.on('data', this._onMessage);

        // Set up connectionStream multiplexing
        const mux = new ObjectMultiplex();
        pipeline(
            connectionStream,
            mux,
            connectionStream,
            this._handleStreamDisconnect,
        );

        // Set up RPC connection
        this._stream = new Duplex({
            objectMode: true,
            read: () => undefined,
            write: () => undefined,
        });
        pipeline(
            this._stream,
            mux.createStream(StreamName.PROVIDER),
            this._stream,
            this._handleStreamDisconnect,
        );

        this._initialize();
    }

    isConnected = () => {
        return this._state.isConnected;
    }

    request = (args) => {
        return new Promise((resolve, reject) => {
            if (!args || typeof args !== 'object' || Array.isArray(args)) {
                throw Error(JSON.stringify({
                    message: 'Invalid request arguments',
                    data: args,
                }));
            }

            const { method, params } = args;

            if (typeof method !== 'string' || method.length === 0) {
                throw Error(JSON.stringify({
                    message: `Invalid request method`,
                    data: args,
                }));
            }

            if (
                params !== undefined &&
                !Array.isArray(params) &&
                (typeof params !== 'object' || params === null)
            ) {
                throw Error(JSON.stringify({
                    message: 'Invalid request params',
                    data: args,
                }));
            }

            const payload = params === undefined || params === null
                ? { method, params: [] }
                : { method, params };

            const requestId = uuid();
            this._stream.push({ ...payload, id: requestId });
            this._pendingRequests[requestId] = { resolve, reject };
        })
    }

    _initialize = async () => {
        try {
            const networkInfo = await this.request({ method: ExtensionRpcMethods.getChainInfo });
            if (networkInfo) {
                this._state.isConnected = true;
                this.emit(ProviderEvents.connect);
            }
        }
        catch (error) {
            this._log.error('SymbolWallet: failed to initialize provider.', error);
            this._state.isConnected = false;
        }
    }

    _onMessage = (payload) => {
        const message = payload.data;
        const { id, result, event, error } = message;
        const pendingRequest = this._pendingRequests[id];

        if (pendingRequest && error) {
            pendingRequest.reject(error);
        }
        else if (pendingRequest) {
            pendingRequest.resolve(result);
        }

        if (event?.type === ProviderEvents.chainChanged) {
            this.emit(ProviderEvents.chainChanged, event.data);
        }
        else if (event?.type === ProviderEvents.accountChanged) {
            this.emit(ProviderEvents.accountChanged);
        }
        else if (event?.type === ProviderEvents.disconnect) {
            this._handleStreamDisconnect(event.data);
        }

        delete this._pendingRequests[id];

        this.emit(ProviderEvents.message, message);
    }

    _handleStreamDisconnect = (error) => {
        this._log.warn('SymbolWallet: Connection lost', error);

        Object.values(this._pendingRequests).forEach(({ reject }) => reject(Error('Connection lost')));
        this._pendingRequests = {};
        this._state.isConnected = false;

        this.emit(ProviderEvents.disconnect, error);
    }
};
