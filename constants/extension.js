export const StreamName = {
    CONTENT: 'symbol-contentscript',
    INPAGE: 'symbol-inpage',
    PROVIDER: 'symbol-provider',
}

export const EXTENSION_MESSAGES = {
    CONNECTION_READY: 'CONNECTION_READY',
    READY: 'METAMASK_EXTENSION_READY',
}

export const DEFAULT_PROVIDER = {
    name: 'Symbol Wallet',
    rdns: 'com.symbol.wallet',
    icon: 'data:image/svg+xml;utf8,<svg></svg>',
}

export const ExtensionRpcMethods = {
    getPermissions: 'getPermissions',
    requestPermission: 'requestPermission',
    requestTransaction: 'requestTransaction',
    getNetworkType: 'getNetworkType',
    getAccountInfo: 'getAccountInfo',
    requestAccountPermission: 'requestAccountPermission',
}

export const ExtensionPermissions = {
    accountInfo: 'accountInfo',
}

export const ProviderEvents = {
    accountsChanged: 'accountsChanged',
    chainChanged: 'chainChanged',
    connect: 'connect',
    disconnect: 'disconnect',
    message: 'message'
}
