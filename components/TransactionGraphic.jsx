/* eslint-disable react/display-name */
import _ from 'lodash';
import { getAddressName, getColorFromHash, trunc } from '@/utils/helper';
import { AccountAvatar } from './AccountAvatar';
import { TableView } from './TableView';
import { TransactionType } from '@/constants';
import { $t } from '@/localization';
import { filterCustomMosaics, getNativeMosaicAmount } from '@/utils/mosaic';
import Controller from '@/core/Controller';

export const TransactionGraphic = (props) => {
    const { transaction } = props;
    const { ticker, addressBook, currentAccount, networkIdentifier, networkProperties, walletAccounts } = Controller;
    const accounts = walletAccounts[networkIdentifier];
    const signerName = getAddressName(transaction.signerAddress, currentAccount, accounts, addressBook);
    const signerNameColorStyle = {
        color: getColorFromHash(transaction.signerAddress),
    };
    const targetNameColorStyle = {};

    const truncText = (str) => trunc(str, '', 24);
    let actionTypeText = truncText($t(`transactionDescriptor_${transaction.type}`));
    let Target = () => <div />;
    let targetName = '';
    let ActionBody = () => null;

    const TargetWrapper = ({iconSrc}) => (
        <div className="w-14 h-14 rounded-full flex justify-center items-center bg-black">
            <img src={iconSrc} className="w-8 h-8" />
        </div>
    )
    const TargetMosaic = () => <TargetWrapper iconSrc="/images/icon-tx-mosaic.png" />;
    const TargetNamespace = () => <TargetWrapper iconSrc="/images/icon-tx-namespace.png" />;
    const TargetLock = () => <TargetWrapper iconSrc="/images/icon-tx-lock.png" />;

    switch (transaction.type) {
        case TransactionType.TRANSFER:
            Target = () => <AccountAvatar address={transaction.recipientAddress} size="md" />;
            targetName = getAddressName(transaction.recipientAddress, currentAccount, accounts, addressBook);
            targetNameColorStyle.color = getColorFromHash(transaction.recipientAddress);
            const transferredAmount = getNativeMosaicAmount(transaction.mosaics, networkProperties.networkCurrency.mosaicId);
            const hasMessage = !!transaction.message;
            const hasCustomMosaic = !!filterCustomMosaics(transaction.mosaics, networkProperties.networkCurrency.mosaicId).length;

            if (hasMessage && transaction.message.isDelegatedHarvestingMessage) {
                actionTypeText = truncText($t(`transactionDescriptor_${transaction.type}_harvesting`));
            }

            ActionBody = () => (
                <>
                    {hasMessage && <img className="w-6 h-6 mr-2" src="/images/icon-tx-message.png" />}
                    {hasCustomMosaic && <img className="w-6 h-6 mr-2" src="/images/icon-select-mosaic-custom.png" />}
                    {!!transferredAmount && <p>{Math.abs(transferredAmount)} {ticker}</p>}
                </>
            );
            break;
        case TransactionType.NAMESPACE_REGISTRATION:
            Target = TargetNamespace;
            targetName = transaction.namespaceName;
            break;
        case TransactionType.MOSAIC_ALIAS:
            Target = TargetMosaic;
            targetName = transaction.mosaicId;
            ActionBody = () => <p>{truncText(transaction.namespaceName)}</p>;
            break;
        case TransactionType.ADDRESS_ALIAS:
            Target = () => <AccountAvatar address={transaction.address} size="md" />;
            targetName = getAddressName(transaction.address, currentAccount, accounts, addressBook);
            targetNameColorStyle.color = getColorFromHash(transaction.address);
            ActionBody = () => <p>{truncText(transaction.namespaceName)}</p>;
            break;
        case TransactionType.MOSAIC_DEFINITION:
            Target = TargetMosaic;
            targetName = transaction.mosaicId;
            break;
        case TransactionType.MOSAIC_SUPPLY_CHANGE:
            Target = TargetMosaic;
            targetName = transaction.mosaicId;
            ActionBody = () => <p>{transaction.delta}</p>;
            break;
        case TransactionType.MOSAIC_SUPPLY_REVOCATION:
            Target = () => <AccountAvatar address={transaction.sourceAddress} size="md" />;
            targetName = getAddressName(transaction.sourceAddress, currentAccount, accounts, addressBook);
            targetNameColorStyle.color = getColorFromHash(transaction.sourceAddress);
            ActionBody = () => (
                <>
                    <img className="w-6 h-6 mr-2" src="/images/icon-select-mosaic-custom.png" />
                    <p>{transaction.mosaicId}</p>
                </>
            );
            break;
        case TransactionType.ACCOUNT_MOSAIC_RESTRICTION:
        case TransactionType.ACCOUNT_ADDRESS_RESTRICTION:
        case TransactionType.ACCOUNT_OPERATION_RESTRICTION:
            Target = () => <AccountAvatar address={transaction.signerAddress} size="md" />;
            targetName = getAddressName(transaction.signerAddress, currentAccount, accounts, addressBook);
            targetNameColorStyle.color = getColorFromHash(transaction.signerAddress);
            ActionBody = () => <p>{truncText($t(`data_${transaction.restrictionType}`))}</p>;
            break;
        case TransactionType.MOSAIC_GLOBAL_RESTRICTION: {
            Target = () => <TargetMosaic />;
            targetName = transaction.referenceMosaicId;
            const actionText = truncText(
                `${transaction.restrictionKey} ${$t(`data_${transaction.newRestrictionType}`)} ${transaction.newRestrictionValue}`
            );
            ActionBody = () => <p>{actionText}</p>;
            break;
        }
        case TransactionType.MOSAIC_ADDRESS_RESTRICTION: {
            Target = () => <AccountAvatar address={transaction.targetAddress} size="md" />;
            targetName = getAddressName(transaction.targetAddress, currentAccount, accounts, addressBook);
            targetNameColorStyle.color = getColorFromHash(transaction.targetAddress);
            const actionText = truncText(`${transaction.restrictionKey} = ${transaction.newRestrictionValue}`);
            ActionBody = () => <p>{actionText}</p>;
            break;
        }
        case TransactionType.MULTISIG_ACCOUNT_MODIFICATION:
            Target = () => <AccountAvatar address={transaction.signerAddress} size="md" />;
            targetName = getAddressName(transaction.signerAddress, currentAccount, accounts, addressBook);
            targetNameColorStyle.color = getColorFromHash(transaction.signerAddress);
            break;
        case TransactionType.VRF_KEY_LINK:
        case TransactionType.NODE_KEY_LINK:
        case TransactionType.VOTING_KEY_LINK:
        case TransactionType.ACCOUNT_KEY_LINK: {
            Target = () => <AccountAvatar address={transaction.linkedAccountAddress} size="md" />;
            targetName = getAddressName(transaction.linkedAccountAddress, currentAccount, accounts, addressBook);
            targetNameColorStyle.color = getColorFromHash(transaction.linkedAccountAddress);
            const actionText = truncText(`${$t(`data_${transaction.linkAction}`)}`);
            ActionBody = () => <p>{actionText}</p>;
            break;
        }
        case TransactionType.HASH_LOCK: {
            Target = () => <TargetLock />;
            targetName = $t('transactionDescriptionShort_hashLock', { duration: transaction.duration });
            const lockedAmount = Math.abs(transaction.lockedAmount);
            ActionBody = () => <p>{lockedAmount} {ticker}</p>;
            break;
        }
        case TransactionType.SECRET_LOCK:
        case TransactionType.SECRET_PROOF: {
            Target = () => <TargetLock />;
            targetName = '';
            ActionBody = () => <p>{truncText(transaction.secret)}</p>;
            break;
        }
        case TransactionType.ACCOUNT_METADATA: {
            Target = () => <AccountAvatar address={transaction.targetAddress} size="md" />;
            targetName = getAddressName(transaction.targetAddress, currentAccount, accounts, addressBook);
            targetNameColorStyle.color = getColorFromHash(transaction.targetAddress);
            ActionBody = () => <p>{truncText(transaction.scopedMetadataKey)}</p>;
            break;
        }
        case TransactionType.NAMESPACE_METADATA: {
            Target = () => <TargetNamespace />;
            targetName = transaction.targetNamespaceId;
            ActionBody = () => <p>{truncText(transaction.scopedMetadataKey)}</p>;
            break;
        }
        case TransactionType.MOSAIC_METADATA: {
            Target = () => <TargetMosaic />;
            targetName = transaction.targetMosaicId;
            ActionBody = () => <p>{truncText(transaction.scopedMetadataKey)}</p>;
            break;
        }
    }

    const getTableData = () =>
        _.omit(
            transaction,
            'aggregateHash',
            'amount',
            'lockedAmount',
            'id',
            'innerTransactions',
            'cosignaturePublicKeys',
            'deadline',
            'type',
            'fee',
            'status',
            'group',
            'height',
            'hash',
            'signerPublicKey',
            'signerAddress',
            'recipientAddress',
            'sourceAddress'
        );

    return (
        <div className="relative w-full flex flex-col overflow-hidden p-4 rounded-xl bg-card">
            <p className="font-mono w-60 break-all" style={signerNameColorStyle}>
                {signerName}
            </p>
            <div className="w-full flex flex-row justify-between my-2">
                <AccountAvatar size="md" address={transaction.signerAddress} />
                <div className="relative flex-1 flex-col items-center justify-center mx-4">
                    <p className="text-center font-mono mb-2">{actionTypeText}</p>
                    <img src="/images/arrow.png" className="absolute w-full h-full top-0 left-0 object-contain select-none" draggable="false" />
                    <div className="w-full min-h-4 flex flex-row justify-center items-center text-center font-mono">
                        <ActionBody />
                    </div>
                </div>
                <div className="flex flex-row items-center">
                    <Target />
                </div>
            </div>
            <p className="text-right self-end font-mono text-primary w-60 break-all" style={targetNameColorStyle}>
                {targetName}
            </p>
            <TableView data={getTableData()} />
        </div>
    );
};
