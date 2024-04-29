'use client'
import Head from 'next/head';
import { Provider } from 'react-redux';
import { NextUIProvider } from '@nextui-org/react';
import { useEffect, useState } from 'react';
import { PersistentStorage, StorageMigration } from '@/storage';
import { isMnemonicStored } from '@/utils/secure';
import { initLocalization } from '@/localization';
import store from '@/store';
import { Slide, ToastContainer } from 'react-toastify';
import { Events } from '@/constants';
import { usePasscode } from '@/utils/hooks';
import { Router, useRouter } from '@/components/Router';
import { processRequestAction } from '@/utils/helper';
import { GlobalStoreHandler } from '@/components/index';


export default function Main({isReady}) {
    const router = useRouter();
    const [isWalletStored, setIsWalletStored] = useState(false);
    const [isWalletLoaded, setIsWalletLoaded] = useState(false);
    const isMainFlowRendered = isWalletLoaded;
    const isWelcomeFlowRendered = !isMainFlowRendered && !isWalletStored;


    const load = async (password) => {
        await store.dispatchAction({ type: 'wallet/loadAccounts', payload: password});
        await store.dispatchAction({ type: 'wallet/loadAll' });
        setIsWalletLoaded(true);
        store.dispatchAction({ type: 'network/connect' });
        const [requestAction] = await PersistentStorage.getRequestQueue();
        //processRequestAction(requestAction, router);
    };
    const init = async () => {
        setIsWalletStored(false)
        setIsWalletLoaded(false);
        await StorageMigration.migrate();
        await initLocalization();

        const isWalletStored = await isMnemonicStored();
        setIsWalletStored(isWalletStored);
        if (isWalletStored) requestPasscode();
    };
    const onWalletStateChange = () => {
        router.goToHome();
        init();
    }

    useEffect(() => {
        // Initialize wallet and load data from cache
        init();

        document.addEventListener(Events.LOGIN, onWalletStateChange);
        document.addEventListener(Events.LOGOUT, onWalletStateChange);

        return () => {
            document.removeEventListener(Events.LOGIN, onWalletStateChange);
            document.removeEventListener(Events.LOGOUT, onWalletStateChange);
        }
    }, []);

    const [Passcode, requestPasscode] = usePasscode(load, null, false);

    return (
        <>
            <Head>
                <title>Symbol Wallet</title>
            </Head>
            <ToastContainer
                stacked
                autoClose={1000}
                position="top-center"
                className="toast-container"
                bodyClassName="toast-body"
                hideProgressBar
                pauseOnHover
                closeOnClick
                transition={Slide}
                icon={false}
            />
            <NextUIProvider>
                <Provider store={store}>
                    <main className="dark text-foreground bg-background">
                        {isReady && (
                            <>
                                <GlobalStoreHandler />
                                <Router
                                    isMainFlowRendered={isMainFlowRendered}
                                    isWelcomeFlowRendered={isWelcomeFlowRendered}
                                />
                            </>
                        )}
                        <Passcode />
                    </main>
                </Provider>
            </NextUIProvider>
        </>
    );
}
