
import { Card, DialogBox, DropdownModal, FormItem, Screen, TableView, TitleBar, useRouter } from '@/components/index';
import { config } from '@/config';
import { WalletController } from '@/core/WalletController';
import { $t, getLanguages, initLocalization, setCurrentLanguage } from '@/localization';
import store, { connect } from '@/store';
import { handleError } from '@/utils/helper';
import { useAsyncState, useDataManager, usePasscode, useProp, useToggle } from '@/utils/hooks';
import packageJSON from '../package.json';

export const Settings = connect((state) => ({
    userCurrency: state.market.userCurrency,
    networkIdentifier: state.network.networkIdentifier,
}))(function Settings(props) {
    const router = useRouter();
    const { userCurrency, networkIdentifier } = props;
    const [selectedNetworkIdentifier, setSelectedNetworkIdentifier] = useProp(networkIdentifier, networkIdentifier);
    const [isLogoutConfirmVisible, toggleLogoutConfirm] = useToggle(false);
    const [isNetworkSelectorVisible, toggleNetworkSelector] = useToggle(false);
    const [isLanguageSelectorVisible, toggleLanguageSelector] = useToggle(false);
    const [isUserCurrencySelectorVisible, toggleUserCurrencySelector] = useToggle(false);
    const [isRequestSelectorVisible, toggleRequestSelector] = useToggle(false);
    const [isAboutSelectorVisible, toggleAboutSelector] = useToggle(false);
    const languageList = Object.entries(getLanguages()).map(([value, label]) => ({ value, label }));
    const currencyList = config.marketCurrencies.map((currency) => ({ value: currency, label: currency }));
    const networkIdentifiers = [
        {
            label: $t('s_settings_networkType_mainnet'),
            value: 'mainnet',
        },
        {
            label: $t('s_settings_networkType_testnet'),
            value: 'testnet',
        },
    ];
    const requestOptionList = [
        {
            label: $t('s_settings_request_autoOpen_confirm'),
            value: 'confirm',
        },
        {
            label: $t('s_settings_request_autoOpen_home'),
            value: 'home',
        },
        {
            label: $t('s_settings_request_autoOpen_off'),
            value: 'off',
        },
    ]
    const aboutTable = {
        appVersion: packageJSON.version,
        symbolSdkVersion: packageJSON.dependencies['symbol-sdk']
    };
    const settingsList = [
        {
            title: $t('s_settings_item_network_title'),
            description: $t('s_settings_item_network_description'),
            icon: '/images/icon-settings-network.png',
            handler: toggleNetworkSelector,
        },
        {
            title: $t('s_settings_item_language_title'),
            description: $t('s_settings_item_language_description'),
            icon: '/images/icon-settings-language.png',
            handler: toggleLanguageSelector,
        },
        {
            title: $t('s_settings_item_currency_title'),
            description: $t('s_settings_item_currency_description'),
            icon: '/images/icon-settings-currency.png',
            handler: toggleUserCurrencySelector,
        },
        {
            title: $t('s_settings_item_permission_title'),
            description: $t('s_settings_item_permission_description'),
            icon: '/images/icon-settings-security.png',
            handler: router.goToSettingsPermissions,
        },
        {
            title: $t('s_settings_item_request_title'),
            description: $t('s_settings_item_request_description'),
            icon: '/images/icon-settings-request.png',
            handler: toggleRequestSelector,
        },
        {
            title: $t('s_settings_item_about_title'),
            description: $t('s_settings_item_about_description'),
            icon: '/images/icon-settings-about.png',
            handler: toggleAboutSelector,
        },
        {
            title: $t('s_settings_item_logout_title'),
            description: $t('s_settings_item_logout_description'),
            icon: '/images/icon-settings-logout.png',
            handler: toggleLogoutConfirm,
        },
    ];

    const [selectNetwork, isNetworkLoading] = useDataManager(
        async (networkIdentifier) => {
            await store.dispatchAction({ type: 'network/changeNetwork', payload: { networkIdentifier } });
            await store.dispatchAction({ type: 'wallet/loadAll' });
            await store.dispatchAction({ type: 'network/fetchData' });
            await store.dispatchAction({ type: 'account/fetchData' });
            setSelectedNetworkIdentifier(networkIdentifier);
            router.goBack();
        },
        null,
        handleError
    );
    const [requestOption, setRequestOption] = useAsyncState(WalletController.getRequestAutoOpen,WalletController.setRequestAutoOpen);
    const changeLanguage = (language) => {
        setCurrentLanguage(language);
        router.goToHome();
    };
    const changeUserCurrency = (userCurrency) => {
        store.dispatchAction({ type: 'market/changeUserCurrency', payload: userCurrency });
    };
    const logoutConfirm = async () => {
        WalletController.logoutAndClearStorage();
        initLocalization();
        await store.dispatchAction({ type: 'wallet/loadAll' });
        store.dispatchAction({ type: 'network/connect' });
    };
    const [Passcode, showLogoutPasscode] = usePasscode(logoutConfirm);
    const handleLogoutPress = () => {
        toggleLogoutConfirm();
        showLogoutPasscode();
    };

    return (
        <Screen isLoading={isNetworkLoading} titleBar={<TitleBar hasBackButton />}>
            <div>
                {settingsList.map((item, index) => (
                    <button key={'settings' + index} className="w-full" onClick={item.handler}>
                        <FormItem>
                            <Card>
                                <div className="w-full flex flex-row text-left gap-2">
                                    <img src={item.icon} className="w-12 h-12 flex-shrink-0" />
                                    <div>
                                        <h3>{item.title}</h3>
                                        <p>{item.description}</p>
                                    </div>
                                </div>
                            </Card>
                        </FormItem>
                    </button>
                ))}
            </div>
            <DropdownModal
                title={$t('s_settings_networkType_modal_title')}
                list={networkIdentifiers}
                value={selectedNetworkIdentifier}
                isOpen={isNetworkSelectorVisible}
                onChange={selectNetwork}
                onClose={toggleNetworkSelector}
            />
            <DropdownModal
                title={$t('s_settings_item_language_title')}
                list={languageList}
                isOpen={isLanguageSelectorVisible}
                onChange={changeLanguage}
                onClose={toggleLanguageSelector}
            />
            <DropdownModal
                title={$t('s_settings_item_currency_title')}
                list={currencyList}
                value={userCurrency}
                isOpen={isUserCurrencySelectorVisible}
                onChange={changeUserCurrency}
                onClose={toggleUserCurrencySelector}
            />
            <DropdownModal
                title={$t('s_settings_item_request_title')}
                list={requestOptionList}
                value={requestOption}
                isOpen={isRequestSelectorVisible}
                onChange={setRequestOption}
                onClose={toggleRequestSelector}
            />
            <DialogBox
                type="alert"
                title={$t('s_settings_item_about_title')}
                body={<TableView data={aboutTable} />}
                isVisible={isAboutSelectorVisible}
                onSuccess={toggleAboutSelector}
                onCancel={toggleAboutSelector}
            />
            <DialogBox
                type="confirm"
                title={$t('settings_logout_confirm_title')}
                text={$t('settings_logout_confirm_text')}
                isVisible={isLogoutConfirmVisible}
                onSuccess={handleLogoutPress}
                onCancel={toggleLogoutConfirm}
            />
            <Passcode />
        </Screen>
    );
});
