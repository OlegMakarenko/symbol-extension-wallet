import { $t } from 'localization';
import { Alert, Button, FormItem, Screen } from '@/components/index';
import { useRouter } from '@/components/Router';
import { useCallback, useEffect, useRef } from 'react';

export const Welcome = () => {
    const router = useRouter();
    const light = useRef();

    const handleMouseMove = useCallback(e => {
        if (light.current) {
            light.current.style.top = e.pageY + 'px';
            light.current.style.left = e.pageX + 'px';
        }
    }, [light]);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        }
    }, [handleMouseMove])

    return (
        <Screen>
            <div ref={light} className="absolute w-60 h-60 -translate-x-1/2 -translate-y-1/2 rounded-full gradient-spotlight" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/bg-grid.png')] bg-repeat" />

            <div className="w-full h-full flex flex-col z-10 justify-between">
                <div>
                    <img
                        src="/images/logo-symbol-full.png"
                        className="select-none h-12 mx-auto my-10"
                        draggable="false"
                    />
                    <h2 className="text-center">{$t('s_welcome_wallet_title')}</h2>
                </div>
                <img
                    src="/images/art-welcome.png"
                    className="absolute select-none left-0 top-1/2 w-full -translate-y-1/2"
                    draggable="false"
                />
                <Alert
                    type="warning"
                    title="Warning!"
                    body="Please note that the Symbol Browser Wallet stores the account access keys in encrypted form in the browser's local storage. However it can be compromised by a malicious software, what can led to loss of all of your funds. We do not recommend using this software for storing large amounts of funds; please consider safer options, such as hardware wallets, instead."
                    className="absolute left-0 top-1/2 w-full h-full backdrop-blur-md bg-main/50"
                />
                <div className="relative z-10">
                    <FormItem>
                        <Button
                            title={$t('button_walletCreate')}
                            onClick={router.goToCreateWallet}
                        />
                        <FormItem>
                        </FormItem>
                        <Button
                            title={$t('button_walletImport')}
                            isSecondary
                            onClick={router.goToImportWallet}
                        />
                    </FormItem>
                </div>
            </div>
        </Screen>
    )
}
