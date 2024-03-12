import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import store, { connect } from '@/store';
import { TransactionType } from '@/constants';
import { useDataManager, useInit, usePasscode, useToggle } from '@/utils/hooks';
import { MosaicService, NamespaceService, TransactionService } from '@/services';
import { $t } from '@/localization';
import { Screen } from '@/components/Screen';
import { FormItem } from '@/components/FormItem';
import { TableView } from '@/components/TableView';
import { Button } from '@nextui-org/react';
import { Alert } from '@/components/Alert';
import { DialogBox } from '@/components/DialogBox';
import { getUserCurrencyAmountText, handleError } from '@/utils/helper';
import { TitleBar } from '@/components/TitleBar';
import { useLocation } from 'react-router-dom';
import { FeeSelector } from '@/components/FeeSelector';
import { useRouter } from '@/components/Router';
import { getTransactionFees, getUnresolvedIdsFromTransactionDTOs, isAggregateTransaction, transactionFromPayload } from '@/utils/transaction';
import { Card } from '@/components/Card';
import { transactionFromDTO } from '@/utils/dto';
import { signTransactionPayload } from '@/utils/secure';

const SUPPORTED_TRANSACTION_TYPES = [
    TransactionType.AGGREGATE_BONDED,
    TransactionType.AGGREGATE_COMPLETE,
    TransactionType.TRANSFER,
    TransactionType.ADDRESS_ALIAS,
    TransactionType.MOSAIC_ALIAS,
    TransactionType.NAMESPACE_REGISTRATION,
    TransactionType.MOSAIC_DEFINITION,
    TransactionType.MOSAIC_SUPPLY_CHANGE,
    TransactionType.MOSAIC_SUPPLY_REVOCATION,
    TransactionType.VRF_KEY_LINK,
    TransactionType.ACCOUNT_KEY_LINK,
    TransactionType.NODE_KEY_LINK,
    TransactionType.VOTING_KEY_LINK,
    TransactionType.ACCOUNT_METADATA,
    TransactionType.NAMESPACE_METADATA,
    TransactionType.MOSAIC_METADATA,
];

export const TransactionRequest = connect((state) => ({
    currentAccount: state.account.current,
    cosignatories: state.account.cosignatories,
    isMultisigAccount: state.account.isMultisig,
    isAccountReady: state.account.isReady,
    isWalletReady: state.wallet.isReady,
    networkProperties: state.network.networkProperties,
    ticker: state.network.ticker,
    price: state.market.price,
}))(function TransactionRequest(props) {
    const { currentAccount, cosignatories, isMultisigAccount, isAccountReady, isWalletReady, networkProperties, ticker, price } =
        props;
    const router = useRouter();
    const { state } = useLocation();
    const [transaction, setTransaction] = useState(null);
    const [transactionSize, setTransactionSize] = useState(null);
    const [payload, setPayload] = useState('');
    const [styleAmount, setStyleAmount] = useState(null);
    const [userCurrencyAmountText, setUserCurrencyAmountText] = useState('');
    const [speed, setSpeed] = useState('medium');
    const [isTypeSupported, setIsTypeSupported] = useState(false);
    const [isNetworkSupported, setIsNetworkSupported] = useState(false);
    const [isConfirmVisible, toggleConfirm] = useToggle(false);
    const [isSuccessAlertVisible, toggleSuccessAlert] = useToggle(false);
    const [isErrorAlertVisible, toggleErrorAlert] = useToggle(false);
    const isTransactionLoaded = !!transaction;
    const cosignatoryList = { cosignatories };
    const isAggregate = !!transaction?.innerTransactions;

    const transactionFees = useMemo(
        () => (payload ? getTransactionFees(transaction, networkProperties, transactionSize || 0) : {}),
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
            isEmbedded ? 'fee' : null,
        ]);
    const [loadTransaction, isTransactionLoading] = useDataManager(
        async (payload, generationHash) => {
            const transactionDTO = transactionFromPayload(payload);
            const { addresses, mosaicIds, namespaceIds } = getUnresolvedIdsFromTransactionDTOs([transactionDTO]);
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
            const transaction = transactionFromDTO(transactionDTO, transactionOptions, currentAccount.address);

            let styleAmount;
            if (transaction.amount < 0) {
                styleAmount = 'text-danger';
            } else if (transaction.amount > 0) {
                styleAmount = 'text-success';
            }

            let isTypeSupported = false;

            if (isAggregateTransaction(transaction)) {
                isTypeSupported = transaction.innerTransactions.every((transaction) =>
                    SUPPORTED_TRANSACTION_TYPES.some((item) => item === transaction.type)
                );
            } else {
                isTypeSupported = SUPPORTED_TRANSACTION_TYPES.some((item) => item === transaction.type);
            }

            const userCurrencyAmountText = getUserCurrencyAmountText(
                Math.abs(transaction.amount),
                price,
                networkProperties.networkIdentifier
            );

            setPayload(payload);
            setTransactionSize(transactionDTO.size);
            setTransaction(transaction);
            setIsTypeSupported(isTypeSupported);
            setIsNetworkSupported(generationHash === networkProperties.generationHash);
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
            const signedPayload = await signTransactionPayload(password, networkProperties.networkIdentifier, payload, currentAccount)
            await TransactionService.announce(signedPayload, networkProperties);
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

    useEffect(() => {
        if (isAccountReady) loadTransaction(state.payload, state.generationHash);
    }, [state, currentAccount, isAccountReady]);

    const [loadState, isStateLoading] = useDataManager(
        async () => {
            await store.dispatchAction({ type: 'wallet/fetchAll' });
        },
        null,
        handleError
    );
    useInit(loadState, isWalletReady, [currentAccount]);

    const isButtonDisabled = !isTransactionLoaded || !isTypeSupported || !isNetworkSupported || isMultisigAccount;
    const isLoading = !isAccountReady || isTransactionLoading || isSending || isStateLoading;

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
                        <Button fullWidth color="primary" isDisabled={isButtonDisabled} onClick={toggleConfirm}>
                            {$t('button_send')}
                        </Button>
                    </FormItem>
                    <FormItem>
                        <Button fullWidth color="primary" variant="bordered" onClick={router.goToHome}>
                            {$t('button_cancel')}
                        </Button>
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
            {!isTypeSupported && (
                <>
                    <FormItem>
                        <Alert
                            type="warning"
                            title={$t('warning_transactionRequest_transactionType_title')}
                            body={$t('warning_transactionRequest_transactionType_body')}
                        />
                    </FormItem>
                    <FormItem>
                        <Card>
                            <FormItem>
                                <h3>{$t('s_transactionRequest_supportedTypes_title')}</h3>
                                {SUPPORTED_TRANSACTION_TYPES.map((type, index) => (
                                    <p key={index}>
                                        {$t(`transactionDescriptor_${type}`)}
                                    </p>
                                ))}
                            </FormItem>
                        </Card>
                    </FormItem>
                </>
            )}
            <FormItem>
                <p className="s-text-label">{$t('s_transactionDetails_amount')}</p>
                <div style={styles.amountRow}>
                    <p className={`s-text-amount ${styleAmount}`}>
                        {transaction ? transaction.amount : '-'} {ticker} {''}
                    </p>
                    {!!userCurrencyAmountText && (
                        <p className={styleAmount}>{userCurrencyAmountText}</p>
                    )}
                </div>
            </FormItem>
            {/* <FormItem>
                {isTransactionLoaded && !isAggregate && <TransactionGraphic transaction={transaction} isExpanded={isTypeSupported} />}
                {isTransactionLoaded &&
                    isAggregate &&
                    transaction.innerTransactions.map((item, index) => (
                        <FormItem type="list" key={'tx' + index}>
                            <TransactionGraphic transaction={item} isExpanded={isTypeSupported} />
                        </FormItem>
                    ))}
            </FormItem> */}
            <DialogBox
                type="confirm"
                title={$t('transaction_confirm_title')}
                body={
                    <div>
                        <FormItem clear="horizontal">
                            <TableView data={getTransactionPreviewTable(transaction)} />
                        </FormItem>
                        {transaction?.innerTransactions?.map((innerTransaction, index) => (
                            <FormItem key={'inner' + index} clear="horizontal">
                                <TableView data={getTransactionPreviewTable(innerTransaction, true)} />
                            </FormItem>
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
                onSuccess={router.goToHome}
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

const styles = {
    textAmount: {
        // ...fonts.amount,
        // color: colors.textBody,
    },
    outgoing: {
        // color: colors.danger,
    },
    incoming: {
        // color: colors.success,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    userCurrencyText: {
        // ...fonts.body,
    },
};
