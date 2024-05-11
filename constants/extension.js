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
    requestPermission: 'requestPermission',
    requestTransaction: 'requestTransaction',
    getAccountInfo: 'getAccountInfo',
    getChainInfo: 'getChainInfo',
    getPermissions: 'getPermissions',
}

export const ExtensionPermissions = {
    accountInfo: 'accountInfo',
}

export const ProviderEvents = {
    accountChanged: 'accountChanged',
    chainChanged: 'chainChanged',
    connect: 'connect',
    disconnect: 'disconnect',
    message: 'message'
}
