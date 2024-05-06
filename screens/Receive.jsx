import { Card } from '@/components/Card';
import { FormItem } from '@/components/FormItem';
import { Screen } from '@/components/Screen';
import { TableView } from '@/components/TableView';
import { TitleBar } from '@/components/TitleBar';
import { config } from '@/config';
import { $t } from '@/localization';
import { handleError } from '@/utils/helper';
import { connect } from 'react-redux';
import QRCode from 'react-qr-code';
import { InputAmount, TextBox } from '../components';
import { useEffect, useState } from 'react';
import { useDataManager } from '@/utils/hooks';
import { transactionToSymbol } from '@/utils/transaction-to-symbol';
import { createTransactionURI, symbolTransactionToPayload } from '@/utils/transaction';
import { TransactionType } from '@/constants';


export const Receive = connect((state) => ({
    currentAccount: state.account.current,
    isMultisigAccount: state.account.isMultisig,
    isAccountReady: state.account.isReady,
    currentAccountMosaics: state.account.mosaics,
    mosaicInfos: state.wallet.mosaicInfos,
    networkProperties: state.network.networkProperties,
    networkIdentifier: state.network.networkIdentifier,
    ticker: state.network.ticker,
    chainHeight: state.network.chainHeight,
    price: state.market.price,
}))(function Receive(props) {
    const { currentAccount, isAccountReady, networkProperties, networkIdentifier, price } = props;
    const [tableData, setTableData] = useState({});
    const [amount, setAmount] = useState('0');
    const [isAmountValid, setAmountValid] = useState(false);
    const [message, setMessage] = useState('');

    const [generateQrCode, isGeneratingQr, qrCodeData] = useDataManager(
        async (recipientAddress, mosaic, amount, message) => {
            const transaction = {
                type: TransactionType.TRANSFER,
                recipientAddress,
                mosaics: [
                    {
                        ...mosaic,
                        amount
                    }
                ],
                message: {
                    text: message,
                }
            };
            const symbolTransaction = transactionToSymbol(transaction, networkProperties, currentAccount);
            const payload = symbolTransactionToPayload(symbolTransaction);

            return createTransactionURI(payload, networkProperties.generationHash);
        },
        '',
        handleError
    );

    useEffect(() => {
        if (isAccountReady && isAmountValid) {
            const mosaic = {
                id: networkProperties.networkCurrency.mosaicId,
                name: networkProperties.networkCurrency.name,
                divisibility: networkProperties.networkCurrency.divisibility
            };
            const recipientAddress = currentAccount.address;
            setTableData({
                recipientAddress,
                mosaic
            });
            generateQrCode(recipientAddress, mosaic, amount, message);
        }
    }, [currentAccount, isAccountReady, networkProperties, isAmountValid, amount, message])

    return (
        <Screen
            isLoading={!isAccountReady}
            isRefreshing={isGeneratingQr}
            titleBar={<TitleBar hasBackButton hasSettingsButton />}
        >
            <FormItem>
                <h2>{$t('s_receive_title')}</h2>
                <p>{$t('s_receive_description')}</p>
            </FormItem>
            <FormItem>
                <Card>
                    <FormItem>
                        <div className="p-4 bg-secondary-100 rounded-md">
                            <QRCode
                                value={qrCodeData}
                                size={'100%'}
                                className="w-full"
                                bgColor="#E6BFFA"
                                fgColor="#7413A6"
                            />
                        </div>
                    </FormItem>
                    <FormItem>
                        <TableView data={tableData} rawAddresses />
                    </FormItem>
                    <FormItem>
                        <InputAmount
                            title={$t('form_transfer_input_amount')}
                            price={price}
                            networkIdentifier={networkIdentifier}
                            value={amount}
                            onChange={setAmount}
                            onValidityChange={setAmountValid}
                        />
                    </FormItem>
                    <FormItem>
                        <TextBox
                            title={$t('form_transfer_input_message')}
                            value={message}
                            onChange={setMessage}
                        />
                    </FormItem>
                </Card>
            </FormItem>
        </Screen>
    );
});
