import { handleError, trunc } from '@/utils/helper';
import { LoadingIndicator } from './LoadingIndicator';
import { AccountAvatar } from './AccountAvatar';
import { useDataManager, useToggle } from '@/utils/hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import store from '@/store';
import { config } from '@/config';
import { Tab, Tabs } from '@nextui-org/react';
import { $t } from '@/localization';

export const AccountSelector = connect((state) => ({
    currentAccount: state.account.current,
    accounts: state.wallet.accounts,
    balances: state.wallet.balances,
    networkIdentifier: state.network.networkIdentifier,
    ticker: state.network.ticker,
}))(function AccountSelector({ currentAccount, accounts, balances, networkIdentifier, ticker }) {
    const [isListOpen, toggleList] = useToggle(false);
    const [isRemoveConfirmVisible, toggleRemoveConfirm] = useToggle(false);
    const [accountToBeRemoved, setAccountToBeRemoved] = useState(null);
    const selectedPublicKey = currentAccount?.publicKey || null;
    const networkAccounts = accounts[networkIdentifier];

    const getAccountCardStyle = (account) => isAccountSelected(account)
        ? 'bg-secondary-1000 border-secondary'
        : 'bg-background border-card';
    const getAddress = () => trunc(currentAccount.address, 'address');

    const [selectAccount, isSelectAccountLoading] = useDataManager(
        async (account, selectedNetworkIdentifier) => {
            if (selectedNetworkIdentifier !== networkIdentifier) {
                await store.dispatchAction({
                    type: 'network/changeNetwork', payload: {
                        networkIdentifier: selectedNetworkIdentifier
                    }
                });
            }
            if (currentAccount.publicKey !== account.publicKey) {
                await store.dispatchAction({ type: 'wallet/selectAccount', payload: account.publicKey });
                await store.dispatchAction({ type: 'wallet/loadAll' });
            }
            // await store.dispatchAction({ type: 'network/fetchData' });
            // await store.dispatchAction({ type: 'account/fetchData' });
            toggleList();
        },
        null,
        handleError
    );
    const [removeAccount] = useDataManager(
        async (account) => {
            const { publicKey } = account;
            await store.dispatchAction({
                type: 'wallet/removeAccount',
                payload: {
                    publicKey,
                    networkIdentifier,
                },
            });
            if (selectedPublicKey === publicKey) {
                await selectAccount(networkAccounts[0]);
            }
        },
        null,
        handleError
    );

    const isLoading = isSelectAccountLoading;

    const isAccountSelected = (account) => account.publicKey === selectedPublicKey;
    const handleRemovePress = (account) => {
        if (account.accountType === 'external') {
            setAccountToBeRemoved(account);
            toggleRemoveConfirm();
        } else {
            removeAccount(account);
        }
    };
    const handleConfirmRemove = () => {
        removeAccount(accountToBeRemoved);
        toggleRemoveConfirm();
    };

    const fetchBalances = async () => {
        const updatedAccountBalanceStateMap = {};
        for (const account of networkAccounts) {
            updatedAccountBalanceStateMap[account.address] = () =>
                store.dispatchAction({ type: 'wallet/fetchBalance', payload: account.address });
        }
    };

    useEffect(() => {
        if (isListOpen) {
            fetchBalances();
        }
    }, [isListOpen]);

    return (
        <>
            <div
                className="w-60 h-12 px-2 flex flex-row justify-between items-center cursor-pointer border-solid border-1.5 border-secondary rounded-md z-10"
                onClick={toggleList}
            >
                {!!currentAccount && (
                    <div className="relative flex flex-row items-center">
                        <AccountAvatar size="sm" address={currentAccount.address} className="mr-2" />
                        <div>
                            <div className="font-mono text-secondary leading-tight uppercase">{currentAccount.name}</div>
                            <div className="leading-tight">{getAddress()}</div>
                        </div>
                    </div>
                )}
                {!currentAccount && <LoadingIndicator className="h-full" />}
                <img src="/images/icon-down.png" className="w-8 h-8" />
            </div>
            <AnimatePresence>
                {isListOpen && (
                    <motion.div
                        className="fixed w-full h-full top-0 left-0 bg-black z-20 overflow-y-scroll p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="w-full h-full"
                            initial={{ scaleY: 0, originY: 0 }}
                            animate={{ scaleY: 1, originY: 0 }}
                            transition={{ type: 'tween', }}
                        >
                            <Tabs aria-label="Options" radius="full" fullWidth defaultSelectedKey={networkIdentifier}>
                                {config.networkIdentifiers.map((identifier) => (
                                    <Tab key={identifier} title={identifier}>
                                        {accounts[identifier].map((account, index) => (
                                            <motion.div
                                                className={`w-full my-2 shadow-lg rounded-lg p-4 border-solid border-1.5 cursor-pointer ${getAccountCardStyle(account)}`}
                                                transition={{ ease: "easeOut", duration: 0.5, delay: index / 50 }}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                onClick={() => selectAccount(account, identifier)}
                                                key={account.address}
                                            >
                                                <div className="font-mono uppercase opacity-70 leading-tight" >{$t('c_accountCard_title_account')}</div>
                                                <div className="s-text-title">{account.name}</div>
                                                <div className="mt-4 font-mono uppercase opacity-70 leading-tight">{$t('c_accountCard_title_balance')}</div>
                                                <div className="flex flex-row items-baseline">
                                                    <div className="text-4xl">{balances[account.address]}</div>
                                                    <div className="text-xl">{' ' + ticker}</div>
                                                </div>
                                                <div className="mt-4 font-mono uppercase opacity-70 leading-tight">{$t('c_accountCard_title_address')}</div>
                                                <div className="mr-2">{account.address}</div>
                                            </motion.div>
                                        ))}
                                    </Tab>
                                ))}
                            </Tabs>
                        </motion.div>
                        {isLoading && (
                            <div className="absolute left-0 top-0 h-full w-full animation-fade-in flex justify-center items-center">
                                <LoadingIndicator />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
});
