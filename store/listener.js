
import { ListenerService } from '@/services';

export default {
    namespace: 'listener',
    state: {
        listener: null, // listener object
    },
    mutations: {
        setListener(state, payload) {
            state.listener.listener = payload;
            return state;
        },
    },
    actions: {
        // subscribe to all
        connect: async ({ state, commit, dispatchAction }) => {
            const { listener } = state.listener;
            const { networkProperties } = state.network;
            const { current } = state.account;

            if (listener) {
                listener.close();
            }

            try {
                const newListener = new ListenerService(networkProperties, current);
                await newListener.open();
                newListener.listenTransactions(() => {
                    dispatchAction({ type: 'account/fetchData' });
                    dispatchAction({ type: 'transaction/fetchData', payload: { keepPages: true } });
                }, 'confirmed')
                newListener.listenTransactions(() => {
                    dispatchAction({ type: 'transaction/fetchData', payload: { keepPages: true } });
                }, 'unconfirmed')
                commit({ type: 'listener/setListener', payload: newListener });
            } catch {}
        },
    },
};
