import _ from 'lodash';

export default {
    namespace: 'transaction',
    state: {
        partial: [], // List of the Aggregate Bonded transactions, which are awaiting signature
        unconfirmed: [], // List of transactions awaiting confirmation by the network
        confirmed: [], // List of confirmed transactions
        isLastPage: false, // Wether the end of the account transaction list is reached
    },
    mutations: {
        setPartial(state, payload) {
            state.transaction.partial = payload;
            return state;
        },
        setUnconfirmed(state, payload) {
            state.transaction.unconfirmed = payload;
            return state;
        },
        setConfirmed(state, payload) {
            state.transaction.confirmed = payload;
            return state;
        },
        setIsLastPage(state, payload) {
            state.transaction.isLastPage = payload;
            return state;
        },
    },
    actions: {
        // Load data from cache or set an empty values
        loadState: async () => {},
        // Fetch the latest partial, unconfirmed and confirmed transaction lists from API
        fetchData: async () => {},
    },
};
