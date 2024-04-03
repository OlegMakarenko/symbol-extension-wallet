const { transactionFromPayload } = require('@/utils/transaction');
const { transactionFromSymbol } = require('@/utils/transaction-from-symbol');
const { payloads } = require('../test-utils/payloads');
const { walletTransactions } = require('../test-utils/transactions');
const { networkProperties } = require('../test-utils/network');
const { currentAccount } = require('../test-utils/wallet');
const { mosaicInfos } = require('../test-utils/mosaic');

describe('utils/transaction-from-symbol', () => {
    it('maps transactions from payload', () => {
        // Arrange:
        const transactionOptions = {
            networkProperties,
            currentAccount,
            mosaicInfos,
            namespaceNames: {},
            resolvedAddresses: {},
            fillSignerPublickey: currentAccount.publicKey,
        };

        // Act:
        const symbolTransactions = payloads.map(item => transactionFromPayload(item.payload));
        const transactions = symbolTransactions.map(symbolTransaction => transactionFromSymbol(
            symbolTransaction,
            transactionOptions,
            currentAccount.address
        ));

        // Assert:
        transactions.map((transaction, index) => expect(transaction).toEqual(walletTransactions[index]));
    })
})
