import SafeEventEmitter from '@metamask/safe-event-emitter';
import { v4 as uuid } from 'uuid';
import { Duplex, pipeline } from 'readable-stream';
import ObjectMultiplex from 'obj-multiplex';
import { StreamName } from '@/constants';

export class InpageProvider extends SafeEventEmitter {
    _log;
    _state;
    #chainId;

    static _defaultState = {
        isConnected: false,
        initialized: false,
    };

    constructor({
        connectionStream,
        logger = console,
        maxEventListeners = 100,
    }) {
        super();
        this.setMaxListeners(maxEventListeners);

        this._state = {
            ...InpageProvider._defaultState,
        };
        this._log = logger;
        this.#chainId = null;

        // Bind functions to prevent consumers from making unbound calls
        this._handleStreamDisconnect = this._handleStreamDisconnect.bind(this);
        this.request = this.request.bind(this);
        this._onMessage = this._onMessage.bind(this);

        connectionStream.on('data', this._onMessage);

        // Set up connectionStream multiplexing
        const mux = new ObjectMultiplex();
        pipeline(
            connectionStream,
            mux,
            connectionStream,
            this._handleStreamDisconnect.bind(this, 'SymbolWallet'),
        );

        // Set up RPC connection
        this._stream = new Duplex({
            objectMode: true,
            read: () => undefined,
            write: () => undefined,
        });
        pipeline(
            this._stream,
            mux.createStream(StreamName.PROVIDER),//providerChannel,
            this._stream,
            this._handleStreamDisconnect.bind(this, 'SymbolWallet RpcProvider'),
        );
    }


    get chainId() {
        return this.#chainId;
    }

    isConnected() {
        return this._state.isConnected;
    }

    request(args) {
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
            ? { method }
            : { method, params };

        this._stream.push({ ...payload, id: uuid() });
    }

    _onMessage(event) {
        const message = event.data;
        this.emit('message', message)
    }

    _handleStreamDisconnect(streamName, error) {
        const warningMsg = `SymbolWallet: Lost connection to "${streamName}".`;
        this._log.warn(warningMsg, error)
    }
};
