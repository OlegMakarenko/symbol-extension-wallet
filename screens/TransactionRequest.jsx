import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useDataManager, useInit, usePasscode, useToggle } from '@/utils/hooks';
import { MosaicService, NamespaceService, TransactionService } from '@/services';
import { Divider, Spacer } from '@nextui-org/react';
import { getUserCurrencyAmountText, handleError } from '@/utils/helper';
import { useLocation } from 'react-router-dom';
import { getTransactionFees, getUnresolvedIdsFromSymbolTransaction, transactionFromPayload } from '@/utils/transaction';
import { transactionFromSymbol } from '@/utils/transaction-from-symbol';
import { Button, Screen, FormItem, TableView, Alert, DialogBox, TitleBar, FeeSelector, useRouter, TransactionGraphic } from '@/components/index';
import { $t } from '@/localization';
import { networkIdentifierToNetworkType } from '@/utils/network';
import { ExtensionWalletController } from '@/core/ExtensionWalletController';
import { observer } from 'mobx-react-lite';

export const TransactionRequest = observer(function TransactionRequest(props) {
    const { currentAccount, currentAccountInfo, isWalletReady, networkProperties, ticker, price } =
        props;
    const { cosignatories, isMultisigAccount } = currentAccountInfo;
    const router = useRouter();
    const { state } = useLocation();
    const [transaction, setTransaction] = useState(null);
    const [payload, setPayload] = useState('');
    const [styleAmount, setStyleAmount] = useState(null);
    const [userCurrencyAmountText, setUserCurrencyAmountText] = useState('');
    const [speed, setSpeed] = useState('medium');
    const [isNetworkSupported, setIsNetworkSupported] = useState(false);
    const [isConfirmVisible, toggleConfirm] = useToggle(false);
    const [isSuccessAlertVisible, toggleSuccessAlert] = useToggle(false);
    const [isErrorAlertVisible, toggleErrorAlert] = useToggle(false);
    const isTransactionLoaded = !!transaction;
    const cosignatoryList = { cosignatories };
    const isAggregate = !!transaction?.innerTransactions;

    const transactionFees = useMemo(
        () => (payload ? getTransactionFees(transaction, networkProperties) : {}),
        [payload]
    );

    const getTransactionPreviewTable = (data, isEmbedded) =>
        _.omit(data, [
            'amount',
            'innerTransactions',
            'signTransactionObject',
            'signerPublicKey',
            'deadline',
            'cosignaturePublicKeys',
            'aggregateHash',
            isEmbedded ? 'fee' : null,
        ]);
    const [loadTransaction, isTransactionLoading] = useDataManager(
        async (payload) => {
            const symbolTransaction = transactionFromPayload(payload);
            const { addresses, mosaicIds, namespaceIds } = getUnresolvedIdsFromSymbolTransaction([symbolTransaction]);
            const mosaicInfos = await MosaicService.fetchMosaicInfos(networkProperties, mosaicIds);
            const namespaceNames = await NamespaceService.fetchNamespaceNames(networkProperties, namespaceIds);
            const resolvedAddresses = await NamespaceService.resolveAddresses(networkProperties, addresses);
            const transactionOptions = {
                networkProperties,
                currentAccount,
                mosaicInfos,
                namespaceNames,
                resolvedAddresses,
                fillSignerPublickey: currentAccount.publicKey,
            };
            const transaction = transactionFromSymbol(symbolTransaction, transactionOptions, currentAccount.address);

            let styleAmount;
            if (transaction.amount < 0) {
                styleAmount = 'text-danger';
            } else if (transaction.amount > 0) {
                styleAmount = 'text-success';
            }

            const userCurrencyAmountText = getUserCurrencyAmountText(
                Math.abs(transaction.amount),
                price,
                networkProperties.networkIdentifier
            );

            setPayload(payload);
            setTransaction(transaction);
            setIsNetworkSupported(symbolTransaction.network.value === networkIdentifierToNetworkType(networkProperties.networkIdentifier));
            setStyleAmount(styleAmount);
            setUserCurrencyAmountText(userCurrencyAmountText);
        },
        null,
        (e) => {
            handleError(e);
            toggleErrorAlert();
        }
    );
    const [send, isSending] = useDataManager(
        async (password) => {
            await TransactionService.signAndAnnounce(password, transaction, networkProperties, currentAccount);
            toggleSuccessAlert();
        },
        null,
        handleError
    );
    const [Passcode, confirmSend] = usePasscode(send);
    const handleConfirmPress = () => {
        toggleConfirm();
        confirmSend();
    };

    //Update transaction maxFee value when speed is changed or fees recalculated
    useEffect(() => {
        if (transaction) {
            transaction.fee = transactionFees[speed];
        }
    }, [transactionFees, speed, transaction]);

    useInit(() => {
        loadTransaction(state.transactionPayload, state.generationHash);
    }, isWalletReady, [state, currentAccount]);

    const clearAndLeave = async () => {
        await ExtensionWalletController.removeActionRequests([state.id]);
        router.goToHome();
    }

    const isButtonDisabled = !isTransactionLoaded || !isNetworkSupported || isMultisigAccount;
    const isLoading = !isWalletReady || isTransactionLoading || isSending || isStateLoading;

    return (
        <Screen
            titleBar={<TitleBar hasAccountSelector hasSettingsButton />}
            isLoading={isLoading}
            bottomComponent={
                <>
                    <FormItem>
                    <FeeSelector
                        title={$t('input_feeSpeed')}
                        value={speed}
                        fees={transactionFees}
                        ticker={ticker}
                        onChange={setSpeed}
                    />
                    </FormItem>
                    <FormItem>
                        <Button title={$t('button_send')} isDisabled={isButtonDisabled} onClick={toggleConfirm} />
                    </FormItem>
                    <FormItem>
                        <Button title={$t('button_cancel')} isSecondary onClick={clearAndLeave} />
                    </FormItem>
                </>
            }
        >
            <FormItem>
                <h2>{$t('s_transactionRequest_title')}</h2>
                <p>{$t('s_transactionRequest_description')}</p>
            </FormItem>
            {isMultisigAccount && (
                <>
                    <FormItem>
                        <Alert type="warning" title={$t('warning_multisig_title')} body={$t('warning_multisig_body')} />
                    </FormItem>
                    <FormItem>
                        <TableView data={cosignatoryList} />
                    </FormItem>
                </>
            )}
            {!isNetworkSupported && (
                <FormItem>
                    <Alert
                        type="warning"
                        title={$t('warning_transactionRequest_networkType_title')}
                        body={$t('warning_transactionRequest_networkType_body')}
                    />
                </FormItem>
            )}
            <FormItem>
                <h5>{$t('s_transactionDetails_amount')}</h5>
                <div className="flex flex-row items-baseline">
                    <p className={`s-text-amount ${styleAmount}`}>
                        {transaction ? transaction.amount : '-'} {ticker} {''}
                    </p>
                    {!!userCurrencyAmountText && (
                        <p className={styleAmount}>{userCurrencyAmountText}</p>
                    )}
                </div>
            </FormItem>
            <Spacer y={4}/>
            <FormItem>
                {isTransactionLoaded && !isAggregate && <TransactionGraphic transaction={transaction} />}
                {isTransactionLoaded &&
                    isAggregate &&
                    transaction.innerTransactions.map((item, index) => (
                        <FormItem type="list" key={'tx' + index}>
                            <TransactionGraphic transaction={item} />
                        </FormItem>
                    ))}
            </FormItem>
            <DialogBox
                type="confirm"
                title={$t('transaction_confirm_title')}
                body={
                    <div>
                        <FormItem>
                            <TableView data={getTransactionPreviewTable(transaction)} />
                        </FormItem>
                        {transaction?.innerTransactions?.map((innerTransaction, index) => (
                            <div key={'inner' + index}>
                                <Divider className="my-4" />
                                <FormItem>
                                    <TableView data={getTransactionPreviewTable(innerTransaction, true)} />
                                </FormItem>
                            </div>
                        ))}
                    </div>
                }
                isVisible={isConfirmVisible}
                onSuccess={handleConfirmPress}
                onCancel={toggleConfirm}
            />
            <DialogBox
                type="alert"
                title={$t('transaction_success_title')}
                text={$t('transaction_success_text')}
                isVisible={isSuccessAlertVisible}
                onSuccess={clearAndLeave}
            />
            <DialogBox
                type="alert"
                title={$t('s_transactionRequest_error_title')}
                text={$t('s_transactionRequest_error_text')}
                isVisible={isErrorAlertVisible}
                onSuccess={router.goToHome}
            />
            <Passcode />
        </Screen>
    );
});
