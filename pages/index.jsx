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
import { ExtensionWalletController } from '@/core/ExtensionWalletController';
import WalletController from '@/core/WalletController';


export default function Main({isReady}) {
    const router = useRouter();
    const [isWalletStored, setIsWalletStored] = useState(false);
    const [isWalletLoaded, setIsWalletLoaded] = useState(false);
    const isMainFlowRendered = isWalletLoaded;
    const isWelcomeFlowRendered = !isMainFlowRendered && !isWalletStored;

    const load = async (password) => {
        await WalletController.loadCache(password);
        setIsWalletLoaded(true);
        WalletController.runConnectionJob();
        WalletController.fetchMarketData();

        if (await ExtensionWalletController.isAppLaunchWithConfirmEnabled()) {
            const [requestAction] = await PersistentStorage.getRequestQueue();
            processRequestAction(requestAction, router);
        }
    };
    const init = async () => {
        setIsWalletStored(false)
        setIsWalletLoaded(false);
        await StorageMigration.migrate();
        await initLocalization();

        const isWalletStored = await WalletController.isWalletCreated();
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

        WalletController.on(ControllerEventName.LOGIN, onWalletLoginChange);
        WalletController.on(ControllerEventName.LOGOUT, onWalletLoginChange);

        return () => {
            WalletController.removeListener(ControllerEventName.LOGIN, onWalletLoginChange);
            WalletController.removeListener(ControllerEventName.LOGOUT, onWalletLoginChange);
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
