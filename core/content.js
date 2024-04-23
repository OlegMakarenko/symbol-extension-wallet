import browser from 'webextension-polyfill';
import { shouldInjectProvider } from './provider-injection';
import { WindowPostMessageStream } from '@metamask/post-message-stream';
import ObjectMultiplex from 'obj-multiplex';
import { EXTENSION_MESSAGES, StreamName } from '@/constants';
import pump from 'pump';
import PortStream from 'extension-port-stream';

let extensionMux;
let extensionChannel;
let extensionPort;
let extensionStream;
let pageMux;
let pageChannel;

const setupPageStreams = () => {
    // the transport-specific streams for communication between inpage and background
    const pageStream = new WindowPostMessageStream({
        name: StreamName.CONTENT,
        target: StreamName.INPAGE,
    });

    // create and connect channel muxers
    // so we can handle the channels individually
    pageMux = new ObjectMultiplex();
    pageMux.setMaxListeners(25);

    pump(pageMux, pageStream, pageMux, (err) =>
        logStreamDisconnectWarning('SymbolWallet Inpage Multiplex', err),
    );

    pageChannel = pageMux.createStream(StreamName.PROVIDER);
};


const setupExtensionStreams = () => {
    extensionPort = browser.runtime.connect({ name: StreamName.CONTENT });
    extensionStream = new PortStream(extensionPort);

    // create and connect channel muxers
    // so we can handle the channels individually
    extensionMux = new ObjectMultiplex();
    extensionMux.setMaxListeners(25);

    pump(extensionMux, extensionStream, extensionMux, (err) => {
        logStreamDisconnectWarning('SymbolWallet Background Multiplex', err);
    });

    // forward communication across inpage-background for these channels only
    extensionChannel = extensionMux.createStream(StreamName.PROVIDER);

    pump(pageChannel, extensionChannel, pageChannel, (error) =>
        console.debug(
            `SymbolWallet: Muxed traffic for channel "${StreamName.PROVIDER}" failed.`,
            error,
        ),
    );

    extensionPort.onDisconnect.addListener(onDisconnectDestroyStreams);
};

/**
 * When the extension background is loaded it sends the EXTENSION_MESSAGES.READY message to the browser tabs.
 * This listener/callback receives the message to set up the streams after service worker in-activity.
 *
 * @param {object} msg
 * @param {string} msg.name - custom property and name to identify the message received
 * @returns {Promise|undefined}
 */
const onMessageSetUpExtensionStreams = (msg) => {
    if (msg.name === EXTENSION_MESSAGES.READY) {
        if (!extensionStream) {
            setupExtensionStreams();
        }

        return Promise.resolve(`SymbolWallet: handled ${EXTENSION_MESSAGES.READY}`);
    }

    return undefined;
};

const checkForLastError = () => {
    const { lastError } = browser.runtime;

    if (!lastError) {
        return undefined;
    }

    // if it quacks like an Error, its an Error
    if (lastError.stack && lastError.message) {
        return lastError;
    }

    // repair incomplete error object (eg chromium v77)
    return new Error(lastError.message);
}

/**
 * This listener destroys the extension streams when the extension port is disconnected,
 * so that streams may be re-established later when the extension port is reconnected.
 *
 * @param {Error} [err] - Stream connection error
 */
const onDisconnectDestroyStreams = (err) => {
    const lastErr = err || checkForLastError();
    extensionPort.onDisconnect.removeListener(onDisconnectDestroyStreams);
    destroyExtensionStreams();

    /**
     * If an error is found, reset the streams. When running two or more dapps, resetting the service
     * worker may cause the error, "Error: Could not establish connection. Receiving end does not
     * exist.", due to a race-condition. The disconnect event may be called by runtime.connect which
     * may cause issues. We suspect that this is a chromium bug as this event should only be called
     * once the port and connections are ready. Delay time is arbitrary.
     */
    if (lastErr) {
        console.warn(`${lastErr} Resetting the streams.`);
        setTimeout(setupExtensionStreams, 1000);
    }
};

/** Destroys all of the extension streams */
const destroyExtensionStreams = () => {
    pageChannel.removeAllListeners();

    extensionMux.removeAllListeners();
    extensionMux.destroy();

    extensionChannel.removeAllListeners();
    extensionChannel.destroy();

    extensionStream = null;
};

/**
 * Error handler for page to extension stream disconnections
 *
 * @param {string} remoteLabel - Remote stream name
 * @param {Error} error - Stream connection error
 */
function logStreamDisconnectWarning(remoteLabel, error) {
    console.debug(
        `SymbolWallet: Content script lost connection to "${remoteLabel}".`,
        error,
    );
}


const initStreams = () => {
    setupPageStreams();
    setupExtensionStreams();
    browser.runtime.onMessage.addListener(onMessageSetUpExtensionStreams);
};

const initContentScript = () => {
    if (shouldInjectProvider()) {
        initStreams();

        // https://bugs.chromium.org/p/chromium/issues/detail?id=1457040
        // Temporary workaround for chromium bug that breaks the content script <=> background connection
        // for prerendered pages. This resets potentially broken extension streams if a page transitions
        // from the prerendered state to the active state.
        if (document.prerendering) {
            document.addEventListener('prerenderingchange', () => {
                onDisconnectDestroyStreams(
                    new Error('Prerendered page has become active.'),
                );
            });
        }
    }
};

initContentScript();
