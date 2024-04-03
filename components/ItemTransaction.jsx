
import { AccountAvatar, Card } from '@/components/index';
import { TransactionType } from '@/constants';
import { $t } from '@/localization';
import { connect } from '@/store';
import { formatDate, getAddressName, trunc } from '@/utils/helper';
import { isAggregateTransaction, isHarvestingServiceTransaction, isIncomingTransaction, isOutgoingTransaction } from '@/utils/transaction';

export const ItemTransaction = connect((state) => ({
    currentAccount: state.account.current,
    walletAccounts: state.wallet.accounts,
    networkIdentifier: state.network.networkIdentifier,
    //addressBook: state.addressBook.addressBook,
    ticker: state.network.ticker,
}))(function ItemTransaction(props) {
    const { currentAccount, walletAccounts, networkIdentifier, addressBook, group, transaction, ticker, isDateHidden, onPress } =
        props;
    const accounts = walletAccounts[networkIdentifier];
    const { type, timestamp, amount, signerAddress, recipientAddress } = transaction;
    const dateText = !isDateHidden
        ? formatDate(timestamp, $t, true)
        : '';
    let iconSrc;
    let accountAvatarAddress;
    let action = $t(`transactionDescriptor_${type}`);
    let description = '';
    let amountText = '';
    let styleAmount = '';
    let cardStyles = '';

    if (amount < 0) {
        amountText = `${amount} ${ticker}`;
        styleAmount = 'text-danger';
    } else if (amount > 0) {
        amountText = `${amount} ${ticker}`;
        styleAmount = 'text-success';
    }

    if (type === TransactionType.TRANSFER && isOutgoingTransaction(transaction, currentAccount)) {
        const address = getAddressName(recipientAddress, currentAccount, accounts, addressBook);
        const isAddressName = address !== recipientAddress;
        const addressText = isAddressName ? address : trunc(address, 'address');
        accountAvatarAddress = recipientAddress;
        action = $t(`transactionDescriptor_${type}_outgoing`);
        description = $t('transactionDescriptionShort_transferTo', { address: addressText });
        iconSrc = '/images/icon-tx-transfer.png';
    } else if (type === TransactionType.TRANSFER && isIncomingTransaction(transaction, currentAccount)) {
        const address = getAddressName(signerAddress, currentAccount, accounts, addressBook);
        const isAddressName = address !== signerAddress;
        const addressText = isAddressName ? address : trunc(address, 'address');
        accountAvatarAddress = signerAddress;
        action = $t(`transactionDescriptor_${type}_incoming`);
        description = $t('transactionDescriptionShort_transferFrom', { address: addressText });
        iconSrc = '/images/icon-tx-transfer.png';
    } else if (type === TransactionType.TRANSFER) {
        const address = getAddressName(signerAddress, currentAccount, accounts, addressBook);
        const isAddressName = address !== signerAddress;
        const addressText = isAddressName ? address : trunc(address, 'address');
        description = $t('transactionDescriptionShort_transferFrom', { address: addressText });
        iconSrc = '/images/icon-tx-transfer.png';
    } else if (isAggregateTransaction(transaction)) {
        const firstTransactionType = transaction.innerTransactions[0]?.type;
        const type = firstTransactionType ? $t(`transactionDescriptor_${firstTransactionType}`) : '';
        const count = transaction.innerTransactions.length - 1;
        description = isHarvestingServiceTransaction(transaction)
            ? $t('transactionDescriptionShort_aggregateHarvesting')
            : count
            ? $t('transactionDescriptionShort_aggregateMultiple', { type, count })
            : type;
        iconSrc = '/images/icon-tx-aggregate.png';
    } else if (type === TransactionType.NAMESPACE_REGISTRATION) {
        const name = transaction.namespaceName;
        description = $t('transactionDescriptionShort_namespaceRegistration', { name });
        iconSrc = '/images/icon-tx-namespace.png';
    } else if (type === TransactionType.ADDRESS_ALIAS) {
        const address = getAddressName(transaction.address, currentAccount, accounts, addressBook);
        const isAddressName = address !== transaction.address;
        const addressText = isAddressName ? address : trunc(address, 'address');
        const target = addressText;
        const name = transaction.namespaceName;
        description = $t('transactionDescriptionShort_alias', { target, name });
        iconSrc = '/images/icon-tx-namespace.png';
    } else if (type === TransactionType.MOSAIC_ALIAS) {
        const target = trunc(transaction.mosaicId, 'address');
        const name = transaction.namespaceName;
        description = $t('transactionDescriptionShort_alias', { target, name });
        iconSrc = '/images/icon-tx-namespace.png';
    } else if (
        type === TransactionType.MOSAIC_DEFINITION ||
        type === TransactionType.MOSAIC_SUPPLY_CHANGE ||
        type === TransactionType.MOSAIC_SUPPLY_REVOCATION
    ) {
        const id = transaction.mosaicId;
        description = $t('transactionDescriptionShort_mosaic', { id });
        iconSrc = '/images/icon-tx-mosaic.png';
    } else if (
        type === TransactionType.ACCOUNT_MOSAIC_RESTRICTION ||
        type === TransactionType.ACCOUNT_ADDRESS_RESTRICTION ||
        type === TransactionType.ACCOUNT_OPERATION_RESTRICTION
    ) {
        const restrictionType = transaction.restrictionType;
        description = $t(`data_${restrictionType}`);
        iconSrc = '/images/icon-tx-restriction.png';
    } else if (type === TransactionType.MOSAIC_GLOBAL_RESTRICTION || type === TransactionType.MOSAIC_ADDRESS_RESTRICTION) {
        const id = transaction.mosaicId || transaction.referenceMosaicId;
        description = $t('transactionDescriptionShort_mosaicRestriction', { id });
        iconSrc = '/images/icon-tx-restriction.png';
    } else if (
        type === TransactionType.VRF_KEY_LINK ||
        type === TransactionType.NODE_KEY_LINK ||
        type === TransactionType.VOTING_KEY_LINK ||
        type === TransactionType.ACCOUNT_KEY_LINK
    ) {
        const linkAction = transaction.linkAction;
        description = $t(`data_${linkAction}`);
        iconSrc = '/images/icon-tx-key.png';
    } else if (type === TransactionType.HASH_LOCK) {
        const duration = transaction.duration;
        description = $t('transactionDescriptionShort_hashLock', { duration });
        iconSrc = '/images/icon-tx-lock.png';
    } else if (type === TransactionType.SECRET_LOCK || type === TransactionType.SECRET_PROOF) {
        description = trunc(transaction.secret, 'hash');
        iconSrc = '/images/icon-tx-lock.png';
    }

    if (group === 'unconfirmed') {
        iconSrc = '/images/icon-tx-unconfirmed.png';
        cardStyles = 'border-solid border-1 border-warning';
    } else if (group === 'partial') {
        cardStyles = 'border-solid border-1 border-info';
    }

    return (
        <Card onPress={onPress} className={cardStyles}>
            <div className="w-full flex flex-row">
                <div className="flex flex-col justify-center pr-4">
                    {(group !== 'confirmed' || !accountAvatarAddress) && <img src={iconSrc} className="w-8 h-8" />}
                    {group === 'confirmed' && !!accountAvatarAddress && (
                        <div title={accountAvatarAddress}>
                            <AccountAvatar address={accountAvatarAddress} size="sm" />
                        </div>
                    )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                    <h3>{action}</h3>
                    <div className="flex self-stretch flex-row justify-between">
                        <p className="text-small opacity-70">{dateText}</p>
                        <div className="flex flex-col items-end">
                            <p className={`font-bold ${styleAmount}`}>{amountText}</p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
});
