import { handleError, trunc } from '@/utils/helper';
import { LoadingIndicator } from './LoadingIndicator';
import { AccountAvatar } from './AccountAvatar';
import { useDataManager, useToggle } from '@/utils/hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { config } from '@/config';
import { Tab, Tabs } from '@nextui-org/react';
import { $t } from '@/localization';
import Controller from '@/core/Controller';
import { observer } from 'mobx-react-lite';
import { NetworkIdentifier } from '@/constants';

export const AccountSelector = observer(function AccountSelector() {
    const { isNetworkConnectionReady, isStateReady, currentAccount, accounts, accountInfos, networkIdentifier, ticker } = Controller;
    const [isListOpen, toggleList] = useToggle(false);
    const selectedPublicKey = currentAccount?.publicKey || null;
    const networkAccounts = accounts[networkIdentifier];
    const accountNameColor = networkIdentifier === NetworkIdentifier.MAIN_NET
        ? 'text-secondary' : 'opacity-50';

    const getAccountCardStyle = (account) => isAccountSelected(account)
        ? 'bg-secondary-1000 border-secondary'
        : 'bg-background border-card';
    const getAddress = () => trunc(currentAccount.address, 'address');
    const getBalanceText = (account, networkIdentifier) => {
        const accountInfo = accountInfos[networkIdentifier][account.publicKey];
        return accountInfo === undefined ? '..' : accountInfo.balance;
    }

    const [selectAccount, isSelectAccountLoading] = useDataManager(
        async (account, selectedNetworkIdentifier) => {
            if (selectedNetworkIdentifier !== networkIdentifier) {
                await Controller.selectNetwork(selectedNetworkIdentifier);
            }
            if (currentAccount.publicKey !== account.publicKey) {
                await Controller.selectAccount(account.publicKey);
            }
            toggleList();
        },
        null,
        handleError
    );

    const isLoading = !isStateReady || !currentAccount;
    const isAccountSelected = (account) => account.publicKey === selectedPublicKey;
    const fetchBalances = async () => {
        for (const account of networkAccounts) {
            if (!accountInfos[networkIdentifier][account.publicKey]) {
                Controller.fetchAccountInfo(account.publicKey);
            }
        }
    };

    useEffect(() => {
        if (isNetworkConnectionReady && isListOpen) {
            fetchBalances();
        }
    }, [isNetworkConnectionReady, isListOpen]);

    return (
        <>
            <button
                className="relative w-60 h-12 px-2 flex flex-row justify-between items-center cursor-pointer border-solid border-1.5 border-secondary rounded-md z-10 text-left"
                disabled={isLoading}
                onClick={toggleList}
            >
                {!!currentAccount && (
                    <div className="relative flex flex-row items-center">
                        <AccountAvatar size="sm" address={currentAccount.address} className={`mr-2 ${isLoading && 'opacity-30 transition-opacity'}`} />
                        <div>
                            <div className={`font-mono leading-tight uppercase ${accountNameColor}`}>{currentAccount.name}</div>
                            <div className="leading-tight">{getAddress()}</div>
                        </div>
                    </div>
                )}
                {isLoading && <LoadingIndicator className="absolute h-full" />}
                <img src="/images/icon-down.png" className="w-8 h-8" />
            </button>
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
                                                    <div className="text-4xl">{getBalanceText(account, identifier)}</div>
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
                        {isSelectAccountLoading && (
                            <div className="absolute bg-main left-0 top-0 h-full w-full animation-fade-in flex justify-center items-center">
                                <LoadingIndicator />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
});
