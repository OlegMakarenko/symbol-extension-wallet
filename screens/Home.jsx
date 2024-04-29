import { $t } from 'localization';
import { useDataManager, usePasscode } from '@/utils/hooks';
import { handleError, processRequestAction } from '@/utils/helper';
import store, { connect } from '@/store';
import { AccountCardWidget, Alert, Button, FormItem, ItemRequestAction, ItemTransaction, Screen, TitleBar, useRouter } from '@/components/index';
import { useEffect, useMemo, useState } from 'react';
import { config } from '@/config';
import { ScrollShadow, Spacer } from '@nextui-org/react';
import { PersistentStorage } from '@/storage';
import { WalletController } from '@/core/WalletController';

export const Home = connect((state) => ({
    balances: state.wallet.balances,
    isMultisigAccount: state.account.isMultisig,
    currentAccount: state.account.current,
    networkIdentifier: state.network.networkIdentifier,
    ticker: state.network.ticker,
    price: state.market.price,
    isWalletReady: state.wallet.isReady,
    unconfirmedTransactions: state.transaction.unconfirmed,
    confirmedTransactions: state.transaction.confirmed,
}))(function Home(props) {
    const {
        balances,
        currentAccount,
        isMultisigAccount,
        networkIdentifier,
        ticker, price,
        isWalletReady,
        unconfirmedTransactions,
        confirmedTransactions
    } = props;
    const router = useRouter();
    const isLoading = !isWalletReady;
    const [renameAccount] = useDataManager(
        async (password, name) => {
            await store.dispatchAction({
                type: 'wallet/renameAccount',
                payload: {
                    publicKey: currentAccount.publicKey,
                    networkIdentifier,
                    name,
                    password
                },
            });
            store.dispatchAction({ type: 'account/loadState' });
        },
        null,
        handleError
    );
    const [Passcode, confirmRename] = usePasscode(renameAccount);
    const openBlockExplorer = () => window.open(config.explorerURL[networkIdentifier] + '/accounts/' + currentAccount.address, '_blank');

    const accountBalance = currentAccount ? balances[currentAccount.address] : '-';
    const accountName = currentAccount?.name || '-';
    const accountAddress = currentAccount?.address || '-';

    const limitedTransactions = useMemo(() => confirmedTransactions.slice(0, 5), [confirmedTransactions]);

    const [requests, setRequests] = useState([]);
    const refreshActionRequests = async () => {
        const requests = await PersistentStorage.getRequestQueue();
        setRequests(requests);
    }
    const declineActionRequest = async (request) => {
        await WalletController.removeRequests([request.id]);
        refreshActionRequests();
    }
    const handleActionRequest = (request) => {
        processRequestAction(request, router);
    }
    useEffect(() => {
        refreshActionRequests()
    }, []);

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
                    onSendPress={router.goToSend}
                    onDetailsPress={router.goToAccountDetails}
                    onNameChange={confirmRename}
                />
            </FormItem>
            {isMultisigAccount && (
                <FormItem>
                    <Alert
                        type="warning"
                        title={$t('warning_multisig_title')}
                        body={$t('warning_multisig_body')}
                    />
                </FormItem>
            )}
            {requests.length > 0 && (
                <>
                    <Spacer y={4} />
                    <FormItem>
                        <h2>Request Action</h2>
                        {requests.map((item) => (
                            <FormItem key={'unconfirmed' + item.hash}>
                                <ItemRequestAction
                                    request={item}
                                    router={router}
                                    onDetailsClick={handleActionRequest}
                                    onCancelClick={declineActionRequest}
                                />
                            </FormItem>
                        ))}
                    </FormItem>
                </>
            )}
            {confirmedTransactions.length > 0 && (
                <>
                    <Spacer y={4} />
                    <FormItem>
                        <h2>{$t('screen_History')}</h2>
                        <ScrollShadow visibility={confirmedTransactions.length > 5 ? 'bottom' : 'none'} size={100}>
                            {unconfirmedTransactions.map((item) => (
                                <FormItem key={'unconfirmed' + item.hash}>
                                    <ItemTransaction group="unconfirmed" transaction={item} />
                                </FormItem>
                            ))}
                            {limitedTransactions.map((item) => (
                                <FormItem key={'confirmed' + item.hash}>
                                    <ItemTransaction group="confirmed" transaction={item} />
                                </FormItem>
                            ))}
                        </ScrollShadow>
                        {confirmedTransactions.length > 5 && (
                            <Button title={$t('button_openTransactionInExplorer')} onClick={openBlockExplorer} />
                        )}
                    </FormItem>
                </>
            )}
            <Passcode />
        </Screen>
    );
});
