
import { Card, DialogBox, DropdownModal, FormItem, Screen, TitleBar, useRouter } from '@/components/index';
import { config } from '@/config';
import { $t, getLanguages, initLocalization, setCurrentLanguage } from '@/localization';
import store, { connect } from '@/store';
import { handleError } from '@/utils/helper';
import { useDataManager, usePasscode, useProp, useToggle } from '@/utils/hooks';
import { logOut } from '@/utils/secure';

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
            title: $t('s_settings_item_permission_title'),
            description: $t('s_settings_item_permission_description'),
            icon: '/images/icon-settings-security.png',
            handler: router.goToSettingsPermissions,
        },
        {
            title: $t('s_settings_item_currency_title'),
            description: $t('s_settings_item_currency_description'),
            icon: '/images/icon-settings-currency.png',
            handler: toggleUserCurrencySelector,
        },
        {
            title: $t('s_settings_item_about_title'),
            description: $t('s_settings_item_about_description'),
            icon: '/images/icon-settings-about.png',
            handler: () => {}, //router.goToSettingsAbout,
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
    const changeLanguage = (language) => {
        setCurrentLanguage(language);
        router.goToHome();
    };
    const changeUserCurrency = (userCurrency) => {
        store.dispatchAction({ type: 'market/changeUserCurrency', payload: userCurrency });
    };
    const logoutConfirm = async () => {
        logOut();
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
            <FormItem clear="vertical">
                {settingsList.map((item, index) => (
                    <button key={'settings' + index} className="w-full" onClick={item.handler}>
                        <FormItem>
                            <Card>
                                <div className="w-full flex flex-row text-left gap-2">
                                    <img src={item.icon} className="w-12 h-12"  />
                                    <div>
                                        <h3>{item.title}</h3>
                                        <p>{item.description}</p>
                                    </div>
                                </div>
                            </Card>
                        </FormItem>
                    </button>
                ))}
            </FormItem>
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
