import _ from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Button,
    DialogBox,
    Dropdown,
    FeeSelector,
    FormItem,
    InputAddress,
    InputAmount,
    Screen,
    SelectMosaic,
    TableView,
    TextBox,
    TitleBar,
    useRouter,
} from '@/components/index';
import { $t } from '@/localization';
import { AccountService, MosaicService, TransactionService } from '@/services';
import { connect } from '@/store';
import { getAddressName, handleError, toFixedNumber } from '@/utils/helper';
import { getMosaicsWithRelativeAmounts } from '@/utils/mosaic';
import { getTransactionFees } from '@/utils/transaction';
import { useDataManager, usePasscode, useProp, useToggle, useTransactionFees } from '@/utils/hooks';
import { useLocation } from 'react-router-dom';
import { TransactionType } from '@/constants';
import { Checkbox } from '@nextui-org/react';
import { signTransaction } from '@/utils/secure';

export const Send = connect((state) => ({
    walletAccounts: state.wallet.accounts,
    //addressBook: state.addressBook.addressBook,
    currentAccount: state.account.current,
    cosignatories: state.account.cosignatories,
    multisigAddresses: state.account.multisigAddresses,
    isMultisigAccount: state.account.isMultisig,
    isAccountReady: state.account.isReady,
    currentAccountMosaics: state.account.mosaics,
    mosaicInfos: state.wallet.mosaicInfos,
    networkProperties: state.network.networkProperties,
    networkIdentifier: state.network.networkIdentifier,
    ticker: state.network.ticker,
    chainHeight: state.network.chainHeight,
    price: state.market.price,
}))(function Send(props) {
    const {
        walletAccounts,
        addressBook,
        currentAccount,
        cosignatories,
        multisigAddresses,
        isMultisigAccount,
        isAccountReady,
        currentAccountMosaics,
        networkProperties,
        networkIdentifier,
        ticker,
        chainHeight,
        price,
    } = props;
    const router = useRouter();
    const { state } = useLocation();
    const accounts = walletAccounts[networkIdentifier];
    const [senderList, setSenderList] = useState([]);
    const [sender, setSender] = useProp(currentAccount?.address);
    const [recipient, setRecipient] = useProp(state?.recipientAddress || '');
    const [mosaics, setMosaics] = useProp(currentAccountMosaics);
    const [mosaicId, setMosaicId] = useProp(state?.mosaicId, mosaics[0]?.id);
    const [amount, setAmount] = useProp(state?.amount, '0');
    const [message, setMessage] = useProp(state?.message?.text, '');
    const [isEncrypted, toggleEncrypted] = useToggle(false);
    const [maxFee, setMaxFee] = useState(0);
    const [speed, setSpeed] = useState('medium');
    const [isConfirmVisible, toggleConfirm] = useToggle(false);
    const [isSuccessAlertVisible, toggleSuccessAlert] = useToggle(false);
    const [isAmountValid, setAmountValid] = useState(false);
    const [isRecipientValid, setRecipientValid] = useState(false);

    const mosaicOptions = mosaics.map((mosaic) => ({
        label: mosaic.name,
        value: mosaic.id,
        mosaicInfo: mosaic,
    }));
    const selectedMosaic = mosaics.find((mosaic) => mosaic.id === mosaicId);
    const isButtonDisabled = !isRecipientValid || !isAmountValid || !selectedMosaic;
    const isAccountCosignatoryOfMultisig = !!multisigAddresses?.length;
    const isMultisig = sender !== currentAccount?.address;
    const transaction = {
        type: TransactionType.TRANSFER,
        signerAddress: currentAccount.address,
        sender: isMultisig ? sender : undefined,
        recipient,
        mosaics: selectedMosaic
            ? [
                  {
                      ...selectedMosaic,
                      amount: parseFloat(amount || 0),
                  },
              ]
            : [],
        message: message
            ? {
                  text: message,
                  isEncrypted: !isMultisig ? isEncrypted : false,
              }
            : null,
        messageEncrypted: !!message && !isMultisig ? isEncrypted : null,
        fee: maxFee,
    };
    const cosignatoryList = { cosignatories };

    const transactionFees = useTransactionFees(transaction, networkProperties);

    const getTransactionPreviewTable = (data) => _.omit(data, ['type']);
    const getAvailableBalance = () => {
        const selectedMosaicBalance = selectedMosaic?.amount || 0;
        const selectedMosaicDivisibility = selectedMosaic?.divisibility || 0;
        const isSelectedNativeMosaic = mosaicId === networkProperties.networkCurrency.mosaicId;
        const mosaicAmountSubtractFee = isSelectedNativeMosaic ? parseFloat(maxFee) : 0;

        return Math.max(0, toFixedNumber(selectedMosaicBalance - mosaicAmountSubtractFee, selectedMosaicDivisibility));
    };
    const getMosaicPrice = () => {
        const isSelectedNativeMosaic = mosaicId === networkProperties.networkCurrency.mosaicId;

        return isSelectedNativeMosaic ? price : null;
    };
    const [fetchAccountMosaics, isMosaicsLoading] = useDataManager(
        async (sender) => {
            const { mosaics } = await AccountService.fetchAccountInfo(networkProperties, sender);
            const mosaicIds = mosaics.map((mosaic) => mosaic.id);
            const mosaicInfos = await MosaicService.fetchMosaicInfos(networkProperties, mosaicIds);
            const formattedMosaics = getMosaicsWithRelativeAmounts(mosaics, mosaicInfos);
            setMosaicId(formattedMosaics[0].id);
            setMosaics(formattedMosaics);
        },
        null,
        (e) => {
            handleError(e);
            setMosaicId(null);
            setMosaics([]);
        }
    );
    const [send, isSending] = useDataManager(
        async (password) => {
            await TransactionService.sendTransferTransaction(password, transaction, currentAccount, networkProperties);
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

    // Update transaction maxFee value when speed is changed or fees recalculated
    useEffect(() => {
        if (transactionFees.medium) {
            setMaxFee(transactionFees[speed]);
        }
    }, [transactionFees, speed]);

    // Update properties when account data is loaded
    useEffect(() => {
        if (!mosaicId) {
            setMosaicId(mosaics[0]?.id);
        }
        if (multisigAddresses?.length) {
            const list = [currentAccount.address, ...multisigAddresses].map((address) => ({
                value: address,
                label: getAddressName(address, currentAccount, accounts, addressBook),
            }));
            setSenderList(list);
        }
        setSender(currentAccount.address);
    }, [isAccountReady, mosaicId, currentAccount, multisigAddresses]);

    // Update mosaic list when sender address is changed
    useEffect(() => {
        if (sender === currentAccount.address) {
            setMosaics(currentAccountMosaics);
        } else {
            fetchAccountMosaics(sender);
        }
    }, [sender, currentAccount, currentAccountMosaics]);

    return (
        <Screen
            isLoading={!isAccountReady || isMosaicsLoading || isSending}
            titleBar={<TitleBar hasBackButton hasSettingsButton />}
            bottomComponent={
                <FormItem>
                    <Button title={$t('button_send')} isDisabled={isButtonDisabled} onClick={toggleConfirm} />
                </FormItem>
            }
        >
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
            {!isMultisigAccount && (
                <>
                    <FormItem>
                        <h2>{$t('form_transfer_title')}</h2>
                        <p>{$t('s_send_description')}</p>
                    </FormItem>
                    {isAccountCosignatoryOfMultisig && (
                        <FormItem>
                            <p>{$t('s_send_multisig_description')}</p>
                        </FormItem>
                    )}
                    {isAccountCosignatoryOfMultisig && (
                        <FormItem>
                            <Dropdown title={$t('input_sender')} value={sender} list={senderList} onChange={setSender} />
                        </FormItem>
                    )}
                    <FormItem>
                        <InputAddress
                            title={$t('form_transfer_input_recipient')}
                            value={recipient}
                            onChange={setRecipient}
                            onValidityChange={setRecipientValid}
                        />
                    </FormItem>
                    <FormItem>
                        <SelectMosaic
                            title={$t('form_transfer_input_mosaic')}
                            value={mosaicId}
                            list={mosaicOptions}
                            chainHeight={chainHeight}
                            onChange={setMosaicId}
                        />
                    </FormItem>
                    <FormItem>
                        <InputAmount
                            title={$t('form_transfer_input_amount')}
                            availableBalance={getAvailableBalance()}
                            price={getMosaicPrice()}
                            networkIdentifier={networkIdentifier}
                            value={amount}
                            onChange={setAmount}
                            onValidityChange={setAmountValid}
                        />
                    </FormItem>
                    <FormItem>
                        <TextBox title={$t('form_transfer_input_message')} value={message} onChange={setMessage} />
                    </FormItem>
                    {!isMultisig && (
                        <FormItem>
                            <Checkbox value={isEncrypted} color="secondary" onChange={toggleEncrypted}>
                                {$t('form_transfer_input_encrypted')}
                            </Checkbox>
                        </FormItem>
                    )}
                    <FormItem>
                        <FeeSelector
                            title={$t('form_transfer_input_fee')}
                            value={speed}
                            fees={transactionFees}
                            ticker={ticker}
                            onChange={setSpeed}
                        />
                    </FormItem>
                </>
            )}
            <DialogBox
                type="confirm"
                title={$t('form_transfer_confirm_title')}
                body={<TableView data={getTransactionPreviewTable(transaction)} />}
                isVisible={isConfirmVisible}
                onSuccess={handleConfirmPress}
                onCancel={toggleConfirm}
            />
            <DialogBox
                type="alert"
                title={$t('form_transfer_success_title')}
                text={$t('form_transfer_success_text')}
                isVisible={isSuccessAlertVisible}
                onSuccess={router.goToHome}
            />
            <Passcode />
        </Screen>
    );
});
