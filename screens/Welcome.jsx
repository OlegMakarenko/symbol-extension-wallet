import { Button } from '@nextui-org/react';
import { $t } from 'localization';
import { Screen } from '@/components/Screen';
import { FormItem } from '@/components/FormItem';
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
                            color="primary"
                            className="w-full"
                            onClick={router.goToCreateWallet}
                        >
                            {$t('button_walletCreate')}
                        </Button>
                    <FormItem>
                    </FormItem>
                        <Button
                            color="primary"
                            variant="light"
                            className="w-full"
                            onClick={router.goToImportWallet}
                        >
                            {$t('button_walletImport')}
                        </Button>
                    </FormItem>
                </div>
            </div>
        </Screen>
    )
}
