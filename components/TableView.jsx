import { isSymbolAddress } from '@/utils/account';
import { AccountAvatar } from './AccountAvatar';
import { ButtonCopy } from './ButtonCopy';
import { $t } from '@/localization';
import { connect } from 'react-redux';
import { getAddressName } from '@/utils/helper';
import { FormItem } from './FormItem';

const renderTypeMap = {
    address: [
        'address',
        'recipientAddress',
        'sender',
        'recipient',
        'signerAddress',
        'linkedAccountAddress',
        'targetAddress',
        'sourceAddress',
        'creator',
        'linkedAddress',
        '_cosignatories',
        '_restrictionAddressAdditions',
        '_restrictionAddressDeletions',
        '_addressAdditions',
        '_receivedCosignatures',
        '_addressDeletions',
        '_multisigAddresses',
    ],
    copyButton: [
        'id',
        'metadataValue',
        'privateKey',
        'publicKey',
        'vrfPublicKey',
        'remotePublicKey',
        'linkedPublicKey',
        'nodePublicKey',
        'secret',
        'proof',
        'hash',
        'name',
    ],
    boolean: [
        'supplyMutable',
        'transferable',
        'restrictable',
        'revokable',
        'isSupplyMutable',
        'isTransferable',
        'isRestrictable',
        'isRevokable',
    ],
    fee: ['fee', 'maxFee', 'rentalFee', 'transactionFee'],
    message: ['message'],
    mosaics: ['mosaics'],
    mosaic: ['mosaic'],
    encryption: ['messageEncrypted'],
    transactionType: ['type', 'transactionType', '_restrictionOperationAdditions', '_restrictionOperationDeletions'],
    translate: [
        'registrationType',
        'aliasAction',
        'action',
        'restrictionType',
        'previousRestrictionType',
        'newRestrictionType',
        'linkAction',
    ],
};

const getMosaicIconSrc = (mosaic) =>
    mosaic.name === 'symbol.xym'
        ? '/images/icon-select-mosaic-native.png'
        : '/images/icon-select-mosaic-custom.png';
const getMosaicStyle = (index) => `flex flex-row items-center ${index > 0 && 'mt-4'}`

export const TableView = connect((state) => ({
    currentAccount: state.account.current,
    walletAccounts: state.wallet.accounts,
    networkIdentifier: state.network.networkIdentifier,
    ticker: state.network.ticker,
}))(function TableView(props) {
    const { currentAccount, walletAccounts, networkIdentifier, addressBook, data, ticker, showEmptyArrays, rawAddresses } = props;
    const accounts = walletAccounts[networkIdentifier];

    if (!data || typeof data !== 'object') {
        return null;
    }

    let tableData = data;

    if (!Array.isArray(data)) {
        tableData = Object.entries(data)
            // eslint-disable-next-line no-unused-vars
            .filter(([_, value]) => value !== null && value !== undefined)
            .map(([key, value]) => ({ key, value }));
    }

    const renderKey = (item) => {
        const translatedKey = $t(`data_${item.key}`);

        return <h5>{translatedKey}</h5>;
    };

    const renderValue = (item) => {
        let ItemTemplate;

        Object.keys(renderTypeMap).forEach((renderType) =>
            renderTypeMap[renderType].find((acceptedKey) => {
                if (item.key !== acceptedKey) {
                    return false;
                }

                switch (renderType) {
                    case 'boolean':
                        ItemTemplate = (
                            <div style={styles.bool}>
                                {item.value === true && (
                                    <img src="/images/icon-bool-true.png" style={styles.boolIcon} />
                                )}
                                {item.value === false && (
                                    <img src="/images/icon-bool-false.png" style={styles.boolIcon} />
                                )}
                            </div>
                        );
                        break;
                    case 'transactionType':
                        ItemTemplate = <p>{$t(`transactionDescriptor_${item.value}`)}</p>;
                        break;
                    case 'address':
                        ItemTemplate =
                            !rawAddresses && isSymbolAddress(item.value) ? (
                                <div className="w-full flex flex-row items-center">
                                    <AccountAvatar address={item.value} className="mr-2" size="sm" />
                                    <p className="flex-1 flex-wrap font-mono">
                                        {getAddressName(item.value, currentAccount, accounts, addressBook)}
                                    </p>
                                    <ButtonCopy content={item.value} className="ml-2" />
                                </div>
                            ) : !rawAddresses ? (
                                <div className="w-full flex flex-row items-center">
                                    <img src="/images/icon-account-name.png" className="w-4 h-4 mr-4" />
                                    <p className="flex-1 flex-wrap font-mono">{item.value}</p>
                                    <ButtonCopy content={item.value} className="ml-2" />
                                </div>
                            ) : (
                                <div className="w-full flex flex-row items-center">
                                    <p className="flex-1 flex-wrap font-mono">{item.value}</p>
                                    <ButtonCopy content={item.value} className="ml-2" />
                                </div>
                            );
                        break;
                    case 'copyButton':
                        ItemTemplate = (
                            <div className="flex flex-row items-center w-full">
                                <p className="flex-1 flex-wrap">{item.value}</p>
                                <ButtonCopy content={item.value} className="ml-2" />
                            </div>
                        );
                        break;
                    case 'encryption':
                        ItemTemplate = (
                            <p>{item.value === true ? $t('data_encrypted') : $t('data_unencrypted')}</p>
                        );
                        break;
                    case 'fee':
                        ItemTemplate = (
                            <div className="flex flex-row items-center">
                                <img src="/images/icon-select-mosaic-native.png" className="w-8 h-8 mr-2" />
                                <p>{item.value} {ticker}</p>
                            </div>
                        );
                        break;
                    case 'message':
                        ItemTemplate = (
                            <div className="flex flex-row items-center">
                                {item.value.isEncrypted && (
                                    <img src="/images/icon-tx-lock.png" className="w-4 h-4 mr-2" />
                                )}
                                {item.value.isRaw && (
                                    <img src="/images/icon-tx-data.png" className="w-4 h-4 mr-2" />
                                )}
                                {!item.value.isRaw && (
                                    <p>{item.value.text}</p>
                                )}
                            </div>
                        );
                        break;
                    case 'mosaic':
                        ItemTemplate = (
                            <div className="flex flex-col w-full">
                                <div className={getMosaicStyle(0)}>
                                    <img src={getMosaicIconSrc(item.value)} className="w-8 h-8 mr-2" />
                                    <div className="flex flex-col">
                                        <p>{item.value.name}</p>
                                        <p className="opacity-70">
                                            {item.value.amount === null ? '?' : item.value.amount}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                        break;
                    case 'mosaics':
                        ItemTemplate = (
                            <div className="flex flex-col w-full">
                                {item.value.map((mosaic, index) => (
                                    <div className={getMosaicStyle(index)} key={'t_mos' + index}>
                                        <img src={getMosaicIconSrc(mosaic)} className="w-8 h-8 mr-2" />
                                        <div className="flex flex-col">
                                            <p>{mosaic.name}</p>
                                            <p className="opacity-70">
                                                {mosaic.amount === null ? '?' : mosaic.amount}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                        break;
                    case 'translate':
                        ItemTemplate = <p>{$t(`data_${item.value}`)}</p>;
                        break;
                }

                return true;
            })
        );

        if (!ItemTemplate && Array.isArray(item.value) && item.value.length) {
            return item.value.map((value) => renderValue({ key: `_${item.key}`, value: value }));
        }

        if (!ItemTemplate && typeof item.value === 'object') {
            return null;
        }

        if (!ItemTemplate) {
            ItemTemplate = <p>{item.value}</p>;
        }

        return ItemTemplate;
    };

    const isEmptyField = (item) => {
        if (Array.isArray(item.value)) {
            return !(item.value.length || showEmptyArrays);
        }

        return item.value === '' || item.value === null;
    };

    return (
        <div className="w-full break-all">
            {tableData.map((item, index) =>
                isEmptyField(item) ? null : (
                    <FormItem key={'table' + item.key + index} clear="horizontal">
                        {renderKey(item)}
                        {renderValue(item)}
                    </FormItem>
                )
            )}
        </div>
    );
});

const styles = {
    bool: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    boolIcon: {
        width: 12,
        height: 12,
    },
    fee: {
        flexDirection: 'row',
        alignItems: 'center',
    },
};
