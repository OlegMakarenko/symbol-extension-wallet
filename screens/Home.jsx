import { Button } from '@nextui-org/react';
import { $t } from 'localization';
import { logOut } from '@/utils/secure';
import { Screen } from '@/components/Screen';
import { FormItem } from '@/components/FormItem';
import { useDataManager, useInit } from '@/utils/hooks';
import { handleError } from '@/utils/helper';
import store, { connect } from '@/store';
import { TitleBar } from '@/components/TitleBar';
import { AccountCardWidget } from '@/components/AccountCardWidget';
import { useRouter } from '@/components/Router';

export const Home = connect((state) => ({
    balances: state.wallet.balances,
    isMultisigAccount: state.account.isMultisig,
    currentAccount: state.account.current,
    walletAccounts: state.wallet.accounts,
    networkIdentifier: state.network.networkIdentifier,
    ticker: state.network.ticker,
    price: state.market.price,
    isWalletReady: state.wallet.isReady,
}))(function Home(props) {
    const { balances, currentAccount, walletAccounts, isMultisigAccount, networkIdentifier, ticker, price, isWalletReady } = props;
    const router = useRouter();
    const [loadState, isLoading] = useDataManager(
        async () => {
            await store.dispatchAction({ type: 'wallet/fetchAll' });
        },
        null,
        handleError
    );
    const [renameAccount] = useDataManager(
        async (name) => {
            await store.dispatchAction({
                type: 'wallet/renameAccount',
                payload: {
                    privateKey: currentAccount.privateKey,
                    networkIdentifier,
                    name,
                },
            });
            store.dispatchAction({ type: 'account/loadState' });
        },
        null,
        handleError
    );
    useInit(loadState, isWalletReady, [currentAccount]);

    const accountBalance = currentAccount ? balances[currentAccount.address] : '-';
    const accountName = currentAccount?.name || '-';
    const accountAddress = currentAccount?.address || '-';

    return (
        <Screen
            isRefreshing={isLoading}
            titleBar={<TitleBar hasAccountSelector hasSettingsButton />}
        >
           <FormItem>
                <AccountCardWidget
                    name={accountName}
                    address={accountAddress}
                    balance={accountBalance}
                    ticker={ticker}
                    price={price}
                    networkIdentifier={networkIdentifier}
                    // onReceivePress={Router.goToReceive}
                    // onSendPress={Router.goToSend}
                    onDetailsPress={router.goToAccountDetails}
                    onNameChange={renameAccount}
                />
            </FormItem>
            {isMultisigAccount && (
                <FormItem>
                    {$t('warning_multisig_title')}
                </FormItem>
            )}
            {/* <FormItem>
                <Button color="primary" className="w-100" onClick={logOut}>logOut</Button>
                <Button color="primary" className="w-100" onClick={() => router.goToTransactionRequest({
                    // payload: '680100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000239DCBCFB4AACDD686C9FAE07D481AA02887EF66B09B9F43A1CB1EADCE106C3F000000000298414120A1070000000000CD59BDF009000000C29B45C1FB3576E16BFD3C23B5B0D9AA88AE18518A8D11D0A48084585E24AFE8C0000000000000006000000000000000239DCBCFB4AACDD686C9FAE07D481AA02887EF66B09B9F43A1CB1EADCE106C3F0000000001985441980E6902BE5AF9552EB60601443B6D0DC942B31E15297F0F0000010000000000CE8BA0672E21C07240420F00000000006000000000000000239DCBCFB4AACDD686C9FAE07D481AA02887EF66B09B9F43A1CB1EADCE106C3F0000000001985441980E6902BE5AF9552EB60601443B6D0DC942B31E15297F0F0000010000000000CE8BA0672E21C07240420F0000000000',
                    payload: 'B30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000239DCBCFB4AACDD686C9FAE07D481AA02887EF66B09B9F43A1CB1EADCE106C3F0000000001985441A086010000000000FAE0F2FF09000000980E6902BE5AF9552EB60601443B6D0DC942B31E15297F0F0300010000000000CE8BA0672E21C07240CC672C00000000004869',
                    generationHash: '49D6E1CE276A85B70EAFE52349AACCA389302E7A9754BCF1221E79494FC665A4'
                })}>TR</Button>
            </FormItem> */}
        </Screen>
    );
});
