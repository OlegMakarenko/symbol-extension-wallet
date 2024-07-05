import { useInit } from '@/utils/hooks';
import makeCancellablePromise from 'make-cancellable-promise';
import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import WalletController from '@/core/WalletController';

export const GlobalStoreHandler = observer(() => {
    const { currentAccount, isWalletReady } = WalletController;
    const [fetchPromise, setFetchPromise] = useState(null);

    const fetchAllData = async () => {
        await WalletController.fetchAccountInfo(currentAccount.publicKey);
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
