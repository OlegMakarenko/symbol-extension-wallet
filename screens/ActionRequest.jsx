import _ from 'lodash';
import store, { connect } from '@/store';
import { useDataManager, useInit, usePasscode } from '@/utils/hooks';
import { handleError } from '@/utils/helper';
import { useLocation } from 'react-router-dom';
import { Button, Screen, FormItem, TitleBar, useRouter, Card } from '@/components/index';
import { $t } from '@/localization';
import { WalletController } from '@/core/WalletController';
import { ExtensionRpcMethods } from '@/constants';
import { Divider } from '@nextui-org/react';

export const ActionRequest = connect((state) => ({
    currentAccount: state.account.current,
    cosignatories: state.account.cosignatories,
    isAccountReady: state.account.isReady,
    isWalletReady: state.wallet.isReady,

}))(function ActionRequest(props) {
    const { currentAccount, isAccountReady, isWalletReady } = props;
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

    const [loadState, isStateLoading] = useDataManager(
        async () => {
            await store.dispatchAction({ type: 'wallet/fetchAll' });
        },
        null,
        handleError
    );
    useInit(loadState, isWalletReady, [currentAccount]);

    const clearAndLeave = async () => {
        await WalletController.removeRequests([state.id]);
        router.goToHome();
    }

    const isLoading = !isAccountReady || isStateLoading;

    return (
        <Screen
            titleBar={<TitleBar hasAccountSelector hasSettingsButton />}
            isLoading={isLoading}
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
                <h2>{$t('s_actionRequest_title')}</h2>
                <p>{$t('s_actionRequest_description')}</p>
            </FormItem>
            <FormItem>
                <Card>
                    <h3>{title}</h3>
                    <p>{description}</p>
                    {isPermissionRequest && (
                        <div>
                            <Divider className="my-4" />
                            <h3>{$t(`extensionPermission_${state.payload}`)}</h3>
                            <p>{$t(`extensionPermission_${state.payload}_description`)}</p>
                        </div>
                    )}
                </Card>
            </FormItem>
            <Passcode />
        </Screen>
    );
});
