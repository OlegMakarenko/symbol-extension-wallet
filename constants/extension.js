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
    getPermissions: 'wallet_getPermissions',
    requestPermissions: 'wallet_requestPermissions',
    switchSymbolChain: 'wallet_switchSymbolChain',
    sendTransaction: 'symbol_sendTransaction',
    chainId: 'symbol_chainId',
    requestAccounts: 'symbol_requestAccounts'
}

export const ProviderEvents = {
    accountsChanged: 'accountsChanged',
    chainChanged: 'chainChanged',
    connect: 'connect',
    disconnect: 'disconnect',
    message: 'message'
}
