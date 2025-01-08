// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import * as config from '@/config';

Object.defineProperty(global, '_bitcore', { get() { return undefined }, set() { } })

jest.doMock('@/config', () => ({
    config: {
        "nodeProbeTimeout": 5000,
        "defaultNodes": {
            "testnet": [
                "https://node.testnet.com"
            ],
            "mainnet": [
                "https://node.mainnet.com"
            ]
        },
        "statisticsServiceURL": {
            "testnet": "https://testnet.services",
            "mainnet": "https://mainnet.services"
        },
        "explorerURL": {
            "testnet": "https://testnet.explorer.fyi",
            "mainnet": "https://mainnet.explorer.fyi"
        },
        "faucetURL": "https://testnet.symbol.tools",
        "discordURL": "https://discord.gg/xymcity",
        "githubURL": "https://github.com/symbol",
        "twitterURL": "https://twitter.com/thesymbolchain",
        "marketDataURL": "https://min-api.cryptocompare.com/data/price",
        "marketCurrencies": ["USD", "CNY", "EUR", "GBP", "JPY", "KRW", "UAH"],
        "optInPayoutSigner": {
            "testnet": [
                "E5F5638C626F58E1937C181E668EC383C94C5BC72AAE400C19AD28BDD3A4D37E"
            ],
            "mainnet": [
                "46038372D2A63D5207BDD9B33E9DA3C5B0B8EFAC399BB4103378E7994746CA14"
            ]
        },
        "networkIdentifiers": ["mainnet", "testnet"],
        "defaultNetworkIdentifier": "mainnet",
        "ticker": "XYM",
        "maxSeedAccounts": 3,
        "connectionInterval": 10000,
        "allowedMarkedDataCallInterval": 1000,
        "blockedDomains": [
            "blocked.domain.com",
        ],
        "blockedUrlPaths": [
            "http://blocked.url.com/123"
        ],
        "actionRequestDeadline": 60000,
        "maxSeedAccountsPerNetwork": 10
    }
}));

Object.assign(global, { TextDecoder, TextEncoder });
