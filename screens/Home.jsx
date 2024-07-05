import { $t } from 'localization';
import { useDataManager, useInit, usePasscode } from '@/utils/hooks';
import { handleError, processRequestAction } from '@/utils/helper';
import { AccountCardWidget, Alert, Button, FormItem, ItemRequestAction, ItemTransaction, Screen, TitleBar, useRouter } from '@/components/index';
import { useMemo, useState } from 'react';
import { config } from '@/config';
import { ScrollShadow, Spacer } from '@nextui-org/react';
import { PersistentStorage } from '@/storage';
import { ExtensionWalletController } from '@/core/ExtensionWalletController';
import WalletController from '@/core/WalletController';
import { observer } from 'mobx-react-lite';
import { ControllerEventName } from '@/constants';

export const Home = observer(function Home() {
    const {
        isWalletReady,
        currentAccount,
        currentAccountInfo,
        networkIdentifier,
        ticker,
        price,
    } = WalletController;
    const router = useRouter();
    const defaultUnconfirmedTransactions = useMemo(() => [], []);
    const [fetchConfirmedTransactions, isConfirmedTransactionsLoading, confirmedTransactions] = useDataManager(
        async () => {
            const transactions = await WalletController.fetchAccountTransactions(currentAccount.publicKey);
            return transactions.data;
        },
        WalletController.currentAccountLatestTransactions,
        handleError,
        currentAccount
    );
    const [fetchUnconfirmedTransactions, isUnconfirmedTransactionsLoading, unconfirmedTransactions] = useDataManager(
        async () => {
            const transactions = await WalletController.fetchAccountTransactions(currentAccount.publicKey, { group: 'unconfirmed' });
            return transactions.data;
        },
        defaultUnconfirmedTransactions,
        handleError,
        currentAccount
    );
    const [renameAccount] = useDataManager(
        (password, name) => WalletController.renameAccount({
            publicKey: currentAccount.publicKey,
            name,
            networkIdentifier
        }, password),
        null,
        handleError
    );
    const [Passcode, confirmRename] = usePasscode(renameAccount);
    const openBlockExplorer = () => window.open(config.explorerURL[networkIdentifier] + '/accounts/' + currentAccount.address, '_blank');

    const accountBalance = currentAccountInfo.balance;
    const accountName = currentAccount?.name || '-';
    const accountAddress = currentAccount?.address || '-';

    const limitedTransactions = useMemo(() => confirmedTransactions.slice(0, 5), [confirmedTransactions]);

    const [requests, setRequests] = useState([]);
    const refreshActionRequests = async () => {
        const requests = await PersistentStorage.getRequestQueue();
        setRequests(requests);
    }
    const declineActionRequest = async (request) => {
        await ExtensionWalletController.removeActionRequests([request.id]);
        refreshActionRequests();
    }
    const handleActionRequest = (request) => {
        processRequestAction(request, router);
    }
    const refreshTransactions = () => {
        fetchConfirmedTransactions();
        fetchUnconfirmedTransactions();
    };
    useInit(() => {
        refreshActionRequests();
        refreshTransactions();
        WalletController.on(ControllerEventName.NEW_TRANSACTION_CONFIRMED, refreshTransactions);

        return () => {
            WalletController.removeListener(ControllerEventName.NEW_TRANSACTION_CONFIRMED, refreshTransactions);
        };
    }, isWalletReady, [currentAccount]);

    const isTransactionsEmpty = confirmedTransactions.length === 0 && unconfirmedTransactions.length === 0;
    const isLoading = !currentAccountInfo.isLoaded || isConfirmedTransactionsLoading || isUnconfirmedTransactionsLoading;

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
                    onReceivePress={router.goToReceive}
                    onSendPress={router.goToSend}
                    onDetailsPress={router.goToAccountDetails}
                    onNameChange={confirmRename}
                />
            </FormItem>
            {currentAccountInfo?.isMultisigAccount && (
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
                            <FormItem key={'request' + item.id}>
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
                            <ItemTransaction
                                group="confirmed"
                                transaction={item}
                            />
                        </FormItem>
                    ))}
                </ScrollShadow>
                {confirmedTransactions.length > 5 && (
                    <Button title={$t('button_openTransactionInExplorer')} onClick={openBlockExplorer} />
                )}
                {isTransactionsEmpty && (
                    <p className='w-full text-center font-mono font-bold uppercase opacity-30'>{$t('message_emptyList')}</p>
                )}
            </FormItem>
            <Passcode />
        </Screen>
    );
});
