'use client'
import Head from 'next/head';
import { NextUIProvider } from '@nextui-org/react';
import { useEffect, useState } from 'react';
import { PersistentStorage, StorageMigration } from '@/storage';
import { initLocalization } from '@/localization';
import { Slide, ToastContainer } from 'react-toastify';
import { ControllerEventName } from '@/constants';
import { usePasscode } from '@/utils/hooks';
import { Router, useRouter } from '@/components/Router';
import { processRequestAction } from '@/utils/helper';
import { ConnectionStatus, GlobalStoreHandler } from '@/components/index';
import { WalletController } from '@/core/WalletController';
import Controller from '@/core/Controller';


export default function Main({isReady}) {
    const router = useRouter();
    const [isWalletStored, setIsWalletStored] = useState(false);
    const [isWalletLoaded, setIsWalletLoaded] = useState(false);
    const isMainFlowRendered = isWalletLoaded;
    const isWelcomeFlowRendered = !isMainFlowRendered && !isWalletStored;

    const load = async (password) => {
        await Controller.loadCache(password);
        setIsWalletLoaded(true);
        Controller.runConnectionJob();
        Controller.fetchMarketData();

        if (await WalletController.isRequestAutoOpenEnabled()) {
            const [requestAction] = await PersistentStorage.getRequestQueue();
            processRequestAction(requestAction, router);
        }
    };
    const init = async () => {
        setIsWalletStored(false)
        setIsWalletLoaded(false);
        await StorageMigration.migrate();
        await initLocalization();

        const isWalletStored = await Controller.isWalletCreated();
        setIsWalletStored(isWalletStored);
        if (isWalletStored) requestPasscode();
    };
    const onWalletLoginChange = () => {
        router.goToHome();
        init();
    }

    useEffect(() => {
        // Initialize wallet and load data from cache
        init();

        Controller.on(ControllerEventName.LOGIN, onWalletLoginChange);
        Controller.on(ControllerEventName.LOGOUT, onWalletLoginChange);
        Controller.on(ControllerEventName.NETWORK_CHANGE, Controller.runConnectionJob)

        return () => {
            Controller.removeListener(ControllerEventName.LOGIN, onWalletLoginChange);
            Controller.removeListener(ControllerEventName.LOGOUT, onWalletLoginChange);
            Controller.removeListener(ControllerEventName.NETWORK_CHANGE, Controller.runConnectionJob)
        }
    }, []);

    const [Passcode, requestPasscode] = usePasscode(load, null, 'login');

    return (
        <>
            <Head>
                <title>Symbol Wallet</title>
            </Head>
            <ConnectionStatus />
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
            </NextUIProvider>
        </>
    );
}
