import { $t } from 'localization';
import { Button, FormItem, Screen } from '@/components/index';
import { useRouter } from '@/components/Router';

export const Welcome = () => {
    const router = useRouter();

    return (
        <Screen>
            <div className="w-full h-full flex flex-col justify-around">
                <div>
                    <h2>{$t('s_welcome_wallet_title')}</h2>
                </div>
                <div>
                    <FormItem>
                        <Button
                            title={$t('button_walletCreate')}
                            onClick={router.goToCreateWallet}
                        />
                    <FormItem>
                    </FormItem>
                        <Button
                            title={$t('button_walletImport')}
                            variant="light"
                            onClick={router.goToImportWallet}
                        />
                    </FormItem>
                </div>
            </div>
        </Screen>
    )
}
