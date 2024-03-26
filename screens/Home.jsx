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
    networkProperties: state.network.networkProperties,
    ticker: state.network.ticker,
    price: state.market.price,
    isWalletReady: state.wallet.isReady,
}))(function Home(props) {
    const { balances, currentAccount, walletAccounts, isMultisigAccount, networkProperties, networkIdentifier, ticker, price, isWalletReady } = props;
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
            <FormItem>
                <Button color="primary" onClick={logOut}>logOut</Button>
            </FormItem>
        </Screen>
    );
});
