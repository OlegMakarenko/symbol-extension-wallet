import { WalletEventNames } from '@/constants';
import { InpageProvider } from './InpageProvider';
import {
    isDomainBlocked,
    isValidAnnounceProviderEvent,
    isValidDoctype,
    isValidDocumentElement,
    isValidPathSuffix,
    isValidProviderDetail,
    isValidRequestProviderEvent
} from '@/utils/extension';

/**
 * Determines if the provider should be injected
 *
 * @returns {boolean} {@code true} Whether the provider should be injected
 */
export const shouldInjectProvider = () => {
    return (
        isValidDoctype() &&
        isValidPathSuffix() &&
        isValidDocumentElement() &&
        !isDomainBlocked()
    );
}

export const initializeProvider = ({ connectionStream, providerInfo }) => {
    const provider = new InpageProvider({
        connectionStream,
        maxEventListeners: 100,
    });
    const proxiedProvider = new Proxy(provider, {
        deleteProperty: () => true,
        get(target, propName) {
            return target[propName];
        },
    });

    announceProvider({
        info: providerInfo,
        provider: proxiedProvider,
    });
    setGlobalProvider(proxiedProvider);

    return proxiedProvider;
}

const setGlobalProvider = (providerInstance) => {
    window.SymbolWallet = providerInstance;
    window.dispatchEvent(new Event(WalletEventNames.PROVIDER_INITIALIZED));
}

/**
 * Intended to be used by a wallet. Announces a provider by dispatching
 * an AnnounceProviderEvent, and listening for
 * RequestProviderEvent to re-announce.
 *
 * @throws If the ProviderDetail is invalid.
 * @param providerDetail - The ProviderDetail to announce.
 * @param providerDetail.info - The ProviderInfo to announce.
 * @param providerDetail.provider - The provider to announce.
 */
const announceProvider = (providerDetail) => {
    if (!isValidProviderDetail(providerDetail)) {
        throwError('Invalid ProviderDetail object.');
    }
    const { info, provider } = providerDetail;

    const _announceProvider = () =>
        window.dispatchEvent(
            new CustomEvent(WalletEventNames.PROVIDER_ANNOUNCE, {
                detail: Object.freeze({ info: { ...info }, provider }),
            }),
        );

    _announceProvider();
    window.addEventListener(WalletEventNames.PROVIDER_REQUEST, event => {
        if (!isValidRequestProviderEvent(event)) {
            throwError(
                `Invalid RequestProviderEvent object received from ${WalletEventNames.PROVIDER_REQUEST} event.`,
            );
        }
        _announceProvider();
    });
}

/**
 * Intended to be used by a dapp. Forwards every announced provider to the
 * provided handler by listening for * AnnounceProviderEvent,
 * and dispatches a RequestProviderEvent}.
 *
 * @param handleProvider - A function that handles an announced provider.
 */
export const requestProvider = (handleProvider) => {
    window.addEventListener(WalletEventNames.PROVIDER_ANNOUNCE, (event) => {
        if (!isValidAnnounceProviderEvent(event)) {
            throwError(
                `Invalid AnnounceProviderEvent object received from ${WalletEventNames.PROVIDER_ANNOUNCE} event.`,
            );
        }
        handleProvider(event.detail);
    });

    window.dispatchEvent(new Event(WalletEventNames.PROVIDER_REQUEST));
}

/**
 * Throws an error.
 *
 * @param message - The message to include.
 * @throws an error.
 */
const throwError = (message) => {
    throw new Error(`Symbol Wallet provider injection error. ${message}`);
}
