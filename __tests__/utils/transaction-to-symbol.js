const { transactionFromPayload } = require('@/utils/transaction');
const { transactionToSymbol } = require('@/utils/transaction-to-symbol');
const { payloads } = require('../test-utils/payloads');
const { walletTransactions } = require('../test-utils/transactions');
const { networkProperties } = require('../test-utils/network');
const { currentAccount } = require('../test-utils/wallet');

describe('utils/transaction-to-symbol', () => {
    it('maps transactions to symbol object', () => {
        // Arrange:
        const expectedSymbolTransactions = payloads.map(item => transactionFromPayload(item.payload));

        // Act:
        const symbolTransactions = walletTransactions.map(transaction => transactionToSymbol(
            transaction,
            networkProperties,
            currentAccount
        ));

        // Assert:
        symbolTransactions.map((transaction, index) => expect(transaction.toString()).toEqual(expectedSymbolTransactions[index].toString()));
    })
})
