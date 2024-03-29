import { useInit } from '@/utils/hooks';
import store, { connect } from '@/store';
import makeCancellablePromise from 'make-cancellable-promise';
import { useState } from 'react';

export const GlobalStoreHandler = connect((state) => ({
    currentAccount: state.account.current,
    isWalletReady: state.wallet.isReady,
}))(function GlobalStoreHandler(props) {
    const { currentAccount, isWalletReady } = props;
    const [fetchPromise, setFetchPromise] = useState(null);

    const fetchAllData = async () => {
        await store.dispatchAction({ type: 'wallet/fetchAll' });
    };

    const handleInit = () => {
        if (fetchPromise)
            fetchPromise.cancel();

        const currentFetchPromise = makeCancellablePromise(fetchAllData());

        setFetchPromise(currentFetchPromise);
    };

    useInit(handleInit, isWalletReady, [currentAccount]);

    return null;
});
