import { config } from '@/config';
import { Events } from '@/constants';


/**
 * Checks the doctype of the current document if it exists
 *
 * @returns {boolean} {@code true} if the doctype is html or if none exists
 */
export const isValidDoctype = () => {
    const { doctype } = window.document;

    if (doctype) {
        return doctype.name === 'html';
    }

    return true;
}

/**
 * Returns whether or not the extension (suffix) of the current document is prohibited
 *
 * This checks {@code window.location.pathname} against a set of file extensions
 * that we should not inject the provider into. This check is indifferent of
 * query parameters in the location.
 *
 * @returns {boolean} whether or not the extension of the current document is prohibited
 */
export const isValidPathSuffix = () => {
    const prohibitedTypes = [/\.xml$/u, /\.pdf$/u];
    const currentUrl = window.location.pathname;

    for (let i = 0; i < prohibitedTypes.length; i++) {
        if (prohibitedTypes[i].test(currentUrl)) {
            return false;
        }
    }

    return true;
}

/**
 * Checks the documentElement of the current document
 *
 * @returns {boolean} {@code true} if the documentElement is an html node or if none exists
 */
export const isValidDocumentElement = () => {
    const documentElement = document.documentElement.nodeName;

    if (documentElement) {
        return documentElement.toLowerCase() === 'html';
    }

    return true;
}

/**
 * Checks if the current domain is blocked
 *
 * @returns {boolean} {@code true} if the current domain is blocked
 */
export const isDomainBlocked = () => {
    const { hostname: currentHostname, pathname: currentPathname } = window.location;
    const trimTrailingSlash = (str) => str.endsWith('/') ? str.slice(0, -1) : str;

    return (
        config.blockedDomains.some(blockedDomain =>
            blockedDomain === currentHostname || currentHostname.endsWith(`.${blockedDomain}`),
        ) ||
        config.blockedUrlPaths.some(blockedUrlPath =>
            trimTrailingSlash(blockedUrlPath) === trimTrailingSlash(currentHostname + currentPathname),
        )
    );
}

/**
 * Validates a ProviderDetail object.
 *
 * @param providerDetail - The ProviderDetail to validate.
 * @returns Whether the ProviderDetail is valid.
 */
export const isValidProviderDetail = (providerDetail) => {
    const isObject = (value) =>
        Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    if (
        !isObject(providerDetail) ||
        !isObject(providerDetail.info) ||
        !isObject(providerDetail.provider)
    ) {
        return false;
    }
    const { info } = providerDetail;
    // https://github.com/thenativeweb/uuidv4/blob/bdcf3a3138bef4fb7c51f389a170666f9012c478/lib/uuidv4.ts#L5
    const UUID_V4_REGEX =
    /(?:^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}$)|(?:^0{8}-0{4}-0{4}-0{4}-0{12}$)/u;
    // https://stackoverflow.com/a/20204811
    const FQDN_REGEX = /(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{0,62}[a-zA-Z0-9]\.)+[a-zA-Z]{2,63}$)/u;

    return (
        typeof info.uuid === 'string' &&
        UUID_V4_REGEX.test(info.uuid) &&
        typeof info.name === 'string' &&
        Boolean(info.name) &&
        typeof info.icon === 'string' &&
        info.icon.startsWith('data:image') &&
        typeof info.rdns === 'string' &&
        FQDN_REGEX.test(info.rdns)
    );
}

/**
 * Validates a RequestProviderEvent} object.
 *
 * @param event - The RequestProviderEvent to validate.
 * @returns Whether the RequestProviderEvent is valid.
 */
export const isValidRequestProviderEvent = (event) =>
    event instanceof Event && event.type === Events.PROVIDER_REQUEST;

/**
 * Validates an AnnounceProviderEvent object.
 *
 * @param event - The AnnounceProviderEvent to validate.
 * @returns Whether the AnnounceProviderEvent is valid.
 */
export const isValidAnnounceProviderEvent = (event) => (
    event instanceof CustomEvent &&
    event.type === Events.PROVIDER_ANNOUNCE &&
    Object.isFrozen(event.detail) &&
    isValidProviderDetail(event.detail)
);
