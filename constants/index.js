export * from './extension';

export const DEFAULT_ACCOUNT_NAME = 'My Account';

export const MAX_SEED_ACCOUNTS_PER_NETWORK = 10;

export const WalletEventNames = {
    CONFIRMED_TRANSACTION: 'event.listener.confirmed',
    PARTIAL_TRANSACTION: 'event.listener.partial',
    LOGOUT: 'event.app.logout',
    LOGIN: 'event.app.login',
    PROVIDER_ANNOUNCE: 'symbol:announceProvider',
    PROVIDER_REQUEST: 'symbol:requestProvider',
    PROVIDER_INITIALIZED: 'symbol:initialized'
};

export const ControllerEventName = {
    LOGOUT: 'symbol:app.logout',
    LOGIN: 'symbol:app.login',
    NEW_TRANSACTION_CONFIRMED: 'symbol:transaction.confirmed',
    NEW_TRANSACTION_UNCONFIRMED: 'symbol:transaction.unconfirmed',
    NEW_TRANSACTION_PARTIAL: 'symbol:transaction.partial',
    TRANSACTION_ERROR: 'symbol:transaction.error',
    ACCOUNT_CHANGE: 'symbol:account.change',
    NETWORK_CHANGE: 'symbol:network.change',
    ERROR: 'symbol:app.error',
};

export const WalletAccountType = {
    SEED: 'seed',
    EXTERNAL: 'external'
}

export const TransactionType = {
    RESERVED: 0,
    TRANSFER: 16724,
    NAMESPACE_REGISTRATION: 16718,
    ADDRESS_ALIAS: 16974,
    MOSAIC_ALIAS: 17230,
    MOSAIC_DEFINITION: 16717,
    MOSAIC_SUPPLY_CHANGE: 16973,
    MOSAIC_SUPPLY_REVOCATION: 17229,
    MULTISIG_ACCOUNT_MODIFICATION: 16725,
    AGGREGATE_COMPLETE: 16705,
    AGGREGATE_BONDED: 16961,
    HASH_LOCK: 16712,
    SECRET_LOCK: 16722,
    SECRET_PROOF: 16978,
    ACCOUNT_ADDRESS_RESTRICTION: 16720,
    ACCOUNT_MOSAIC_RESTRICTION: 16976,
    ACCOUNT_OPERATION_RESTRICTION: 17232,
    ACCOUNT_KEY_LINK: 16716,
    MOSAIC_ADDRESS_RESTRICTION: 16977,
    MOSAIC_GLOBAL_RESTRICTION: 16721,
    ACCOUNT_METADATA: 16708,
    MOSAIC_METADATA: 16964,
    NAMESPACE_METADATA: 17220,
    VRF_KEY_LINK: 16963,
    VOTING_KEY_LINK: 16707,
    NODE_KEY_LINK: 16972,
    PERSISTENT_DELEGATION_REQUEST: 'PERSISTENT_DELEGATION_REQUEST',
};

export const NetworkType = {
    MAIN_NET: 104,
    TEST_NET: 152,
};

export const NetworkIdentifier = {
    MAIN_NET: 'mainnet',
    TEST_NET: 'testnet',
};

export const Message = {
    UNLIMITED: '∞',
    UNAVAILABLE: 'v_na',
    INFINITY: '∞',
    MOSAIC: 'v_moasic',
    ADDRESS: 'v_address',
    NO_ALIAS: 'v_noAlias',
    ACTIVE: 'v_active',
    INACTIVE: 'v_inactive',
    UNKNOWN: 'v_unknown',
    EXPIRED: 'v_expired',
    UNCONFIRMED: 'unconfirmed',
    CONFIRMED: 'confirmed',
};

export const MosaicSupplyChangeAction = {
    Decrease: 0,
    Increase: 1
}

export const MosaicSupplyChangeActionMessage = {
    [MosaicSupplyChangeAction.Increase]: 'v_increase',
    [MosaicSupplyChangeAction.Decrease]: 'v_decrease',
};

export const NamespaceRegistrationType = {
    RootNamespace: 0,
    SubNamespace: 1
}

export const NamespaceRegistrationTypeMessage = {
    [NamespaceRegistrationType.RootNamespace]: 'v_rootNamespace',
    [NamespaceRegistrationType.SubNamespace]: 'v_subNamespace',
};

export const AliasAction = {
    Link: 1,
    Unlink: 0
}

export const AliasActionMessage = {
    [AliasAction.Link]: 'v_link',
    [AliasAction.Unlink]: 'v_unlink',
};

export const LinkAction = {
    Link: 1,
    Unlink: 0
}

export const LinkActionMessage = {
    [LinkAction.Link]: 'v_link',
    [LinkAction.Unlink]: 'v_unlink',
};

export const LockHashAlgorithm = {
    Op_Sha3_256: 0,
    Op_Hash_160: 1,
    Op_Hash_256: 2
}

export const LockHashAlgorithmMessage = {
    [LockHashAlgorithm.Op_Sha3_256]: 'Sha3 256',
    [LockHashAlgorithm.Op_Hash_160]: 'Hash 160',
    [LockHashAlgorithm.Op_Hash_256]: 'Hash 256',
};

export const MetadataType = {
    Account: 0,
    Mosaic: 1,
    Namespace: 2
}

export const MetadataTypeMessage = {
    [MetadataType.Account]: 'Account',
    [MetadataType.Mosaic]: 'Mosaic',
    [MetadataType.Namespace]: 'Namespace',
};

export const AddressRestrictionFlag = {
    AllowIncomingAddress: 1,
    AllowOutgoingAddress: 16385,
    BlockIncomingAddress: 32769,
    BlockOutgoingAddress: 49153
}

export const AddressRestrictionFlagMessage = {
    [AddressRestrictionFlag.AllowIncomingAddress]: 'v_AllowIncomingAddresses',
    [AddressRestrictionFlag.AllowOutgoingAddress]: 'v_AllowOutgoingAddresses',
    [AddressRestrictionFlag.BlockIncomingAddress]: 'v_BlockIncomingAddresses',
    [AddressRestrictionFlag.BlockOutgoingAddress]: 'v_BlockOutgoingAddresses',
};

export const MosaicRestrictionFlag = {
    AllowMosaic: 2,
    BlockMosaic: 32770
}

export const MosaicRestrictionFlagMessage = {
    [MosaicRestrictionFlag.AllowMosaic]: 'v_AllowMosaics',
    [MosaicRestrictionFlag.BlockMosaic]: 'v_BlockMosaics',
};

export const OperationRestrictionFlag = {
    AllowOutgoingTransactionType: 16388,
    BlockOutgoingTransactionType: 49156
}

export const OperationRestrictionFlagMessage = {
    [OperationRestrictionFlag.AllowOutgoingTransactionType]: 'v_AllowOutgoingTransactions',
    [OperationRestrictionFlag.BlockOutgoingTransactionType]: 'v_BlockOutgoingTransactions',
};

export const MosaicRestrictionEntryType = {
    ADDRESS: 0,
    GLOBAL: 1
}

export const MosaicRestrictionEntryTypeMessage = {
    [MosaicRestrictionEntryType.ADDRESS]: 'v_MosaicAddressRestriction',
    [MosaicRestrictionEntryType.GLOBAL]: 'v_MosaicGlobalRestriction',
};

export const MosaicRestrictionType = {
    NONE: 0,
    EQ: 1,
    NE: 2,
    LT: 3,
    LE: 4,
    GT: 5,
    GE: 6
}

export const MosaicRestrictionTypeMessage = {
    [MosaicRestrictionType.EQ]: 'v_mosaicRestrictionTypeEQ',
    [MosaicRestrictionType.GE]: 'v_mosaicRestrictionTypeGE',
    [MosaicRestrictionType.GT]: 'v_mosaicRestrictionTypeGT',
    [MosaicRestrictionType.LE]: 'v_mosaicRestrictionTypeLE',
    [MosaicRestrictionType.LT]: 'v_mosaicRestrictionTypeLT',
    [MosaicRestrictionType.NE]: 'v_mosaicRestrictionTypeNE',
    [MosaicRestrictionType.NONE]: 'v_mosaicRestrictionTypeNONE',
};

export const MosaicFlags = {
    NONE: 0,
    SUPPLY_MUTABLE: 1,
    TRANSFERABLE: 2,
    RESTRICTABLE: 4,
    REVOKABLE: 8,
};

export const KNOWN_ACCOUNT_IMAGES = {
    Binance: '/images/account-logos/binance.png',
    Bitbns: '/images/account-logos/bitbns.png',
    Bitflyer: '/images/account-logos/bitflyer.png',
    Bithumb: '/images/account-logos/bithumb.png',
    Bittrex: '/images/account-logos/bittrex.png',
    Coincheck: '/images/account-logos/coincheck.png',
    Copper: '/images/account-logos/copper.png',
    Crex24: '/images/account-logos/crex24.png',
    'Gate.io': '/images/account-logos/gateio.png',
    GraviEX: '/images/account-logos/graviex.png',
    HitBTC: '/images/account-logos/hitbtc.png',
    Huobi: '/images/account-logos/huobi.png',
    Kuna: '/images/account-logos/kuna.png',
    'NEM Group Limited': '/images/account-logos/ngl.png',
    'NEM Group Trust': '/images/account-logos/ngl.png',
    'NEM Holdings Limited': '/images/account-logos/ngl.png',
    'NEM Ventures Limited': '/images/account-logos/nvl.png',
    Okex: '/images/account-logos/okex.png',
    Poloniex: '/images/account-logos/poloniex.png',
    Spectrocoin: '/images/account-logos/spectrocoin.png',
    Upbit: '/images/account-logos/upbit.png',
    XTcom: '/images/account-logos/xtcom.png',
    Yobit: '/images/account-logos/yobit.png',
    Zaif: '/images/account-logos/zaif.png',
    Kucoin: '/images/account-logos/kucoin.png',
    AEX: '/images/account-logos/aex.png',
    Bitrue: '/images/account-logos/bitrue.png',
    Xtheta: '/images/account-logos/xtheta.png',
    Probit: '/images/account-logos/probit.png',
    'ZB.com': '/images/account-logos/zbcom.png',
    Latoken: '/images/account-logos/latoken.png',
    CoinEx: '/images/account-logos/coinex.png',
    Bitbank: '/images/account-logos/bitbank.png',
    Bybit: '/images/account-logos/bybit.png',
    MEXC: '/images/account-logos/mexc.png',
    'Symbol Protocol Treasury': '/images/account-logos/symbol.png',
    'Quadratic Funding': '/images/account-logos/symbol.png',
    'Harvest Network Fee Sink': '/images/account-logos/symbol.png',
    'Namespace and Mosaic Fee Sink': '/images/account-logos/symbol.png',
};
