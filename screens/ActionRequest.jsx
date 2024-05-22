import _ from 'lodash';
import { usePasscode } from '@/utils/hooks';
import { useLocation } from 'react-router-dom';
import { Button, Screen, FormItem, TitleBar, useRouter, Card } from '@/components/index';
import { $t } from '@/localization';
import { WalletController } from '@/core/WalletController';
import { ExtensionRpcMethods } from '@/constants';

export const ActionRequest = () => {
    const router = useRouter();
    const { state } = useLocation();
    const isPermissionRequest = state.method === ExtensionRpcMethods.requestPermission;
    const title = $t(`extensionMethod_${state.method}`);
    const description = $t(`extensionMethod_${state.method}_description`);

    const handleAction = async () => {
        switch (state.method) {
            case ExtensionRpcMethods.requestPermission:
                await WalletController.addPermission(state.sender.origin, state.payload)
        }

        clearAndLeave();
    }
    const [Passcode, confirmAction] = usePasscode(handleAction);

    const clearAndLeave = async () => {
        await WalletController.removeRequests([state.id]);
        router.goToHome();
    }

    return (
        <Screen
            titleBar={<TitleBar hasAccountSelector hasSettingsButton />}
            bottomComponent={
                <>
                    <FormItem>
                        <Button title={$t('button_accept')} onClick={confirmAction} />
                    </FormItem>
                    <FormItem>
                        <Button title={$t('button_cancel')} isSecondary onClick={clearAndLeave} />
                    </FormItem>
                </>
            }
        >
            <FormItem>
                <h2>{title}</h2>
                <p>{description}</p>
            </FormItem>
            <div className="flex-1 flex flex-col items-center justify-around">
                <div className="flex flex-col items-center text-center mb-4">
                    <img src={state.sender.icon} className="bg-white h-32 mx-auto mb-4 rounded-full" />
                    <p className="font-mono leading-tight w-3/4 truncate ...">{state.sender.title}</p>
                    <p className="font-mono opacity-70 leading-tight w-3/4 truncate ...">{state.sender.origin}</p>
                </div>
                <Card>
                    {isPermissionRequest && (
                        <div>
                            <h3>{$t(`extensionPermission_${state.payload}`)}</h3>
                            <p>{$t(`extensionPermission_${state.payload}_description`)}</p>
                        </div>
                    )}
                </Card>
            </div>
            <Passcode />
        </Screen>
    );
};
