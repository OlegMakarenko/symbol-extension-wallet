// need to make sure we aren't affected by overlapping namespaces
// and that we don't affect the app with our namespace
let __define;

/**
 * Caches reference to global define object and deletes it to
 * avoid conflicts with other global define objects, such as
 * AMD's define function
 */
const cleanContextForImports = () => {
    __define = global.define;
    try {
        global.define = undefined;
    } catch (_) {
        console.warn('Symbol - global.define could not be deleted.');
    }
};

/**
 * Restores global define object from cached reference
 */
const restoreContextAfterImports = () => {
    try {
        global.define = __define;
    } catch (_) {
        console.warn('Symbol - global.define could not be overwritten.');
    }
};

cleanContextForImports();

/* eslint-disable import/first */
import { v4 as uuid } from 'uuid';
import { initializeProvider, shouldInjectProvider } from './provider-injection';
import { DEFAULT_PROVIDER, StreamName } from '@/constants';
import { WindowPostMessageStream } from '@metamask/post-message-stream';

restoreContextAfterImports();

//
// setup plugin communication
//

if (shouldInjectProvider()) {
    // setup background connection
    const connectionStream = new WindowPostMessageStream({
        name: StreamName.INPAGE,
        target: StreamName.CONTENT,
    });

    initializeProvider({
        connectionStream,
        providerInfo: {
            uuid: uuid(),
            name: DEFAULT_PROVIDER.name,
            icon: DEFAULT_PROVIDER.icon,
            rdns: DEFAULT_PROVIDER.rdns,
        },
    });
}
