import { Routes, Route, useNavigate } from 'react-router-dom';
import { Welcome } from '@/screens/Welcome';
import { Home } from '@/screens/Home';
import { CreateWallet } from '@/screens/CreateWallet';
import { ImportWallet } from '@/screens/ImportWallet';
import { AccountDetails } from '@/screens/AccountDetails';
import { TransactionRequest } from '@/screens/TransactionRequest';
import { Send } from '@/screens/Send';
import { Settings } from '@/screens/Settings';

const keys = {
    Welcome: '/',
    CreateWallet: '/CreateWallet',
    ImportWallet: '/ImportWallet',
    Home: '/',
    History: '/History',
    Assets: '/Assets',
    Actions: '/Actions',
    AccountDetails: '/AccountDetails',
    AccountList: '/AccountList',
    AddExternalAccount: '/AddExternalAccount',
    AddSeedAccount: '/AddSeedAccount',
    AddressBookEdit: '/AddressBookEdit',
    AddressBookContact: '/AddressBookContact',
    AddressBookList: '/AddressBookList',
    Scan: '/Scan',
    Send: '/Send',
    Receive: '/Receive',
    Settings: '/Settings',
    SettingsAbout: '/SettingsAbout',
    SettingsNetwork: '/SettingsNetwork',
    SettingsSecurity: '/SettingsSecurity',
    TransactionDetails: '/TransactionDetails',
    TransactionRequest: '/TransactionRequest',
    AssetDetails: '/AssetDetails',
    Harvesting: '/Harvesting',
    Revoke: '/Revoke',
    MosaicCreation: '/MosaicCreation',
    Passcode: '/Passcode',
};

export const useRouter = () => {
    const navigate = useNavigate();

    return {
        goBack: () => navigate(-1),
        goToWelcome: () => navigate(keys.Welcome, { replace: true }),
        goToCreateWallet: () => navigate(keys.CreateWallet),
        goToImportWallet: () => navigate(keys.ImportWallet),
        goToHome: () => navigate(keys.Home, { replace: true }),
        goToAccountDetails: () => navigate(keys.AccountDetails),
        goToSend: () => navigate(keys.Send),
        goToTransactionRequest: (state) => navigate(keys.TransactionRequest, { state }),
        goToSettings: () => navigate(keys.Settings),
    };
}

export const Router = ({isWelcomeFlowRendered, isMainFlowRendered}) => {
    return (
        <Routes>
            {isWelcomeFlowRendered && (
                <>
                    <Route path={keys.Welcome} Component={Welcome} />
                    <Route path={keys.CreateWallet} Component={CreateWallet} />
                    <Route path={keys.ImportWallet} Component={ImportWallet} />
                </>
            )}
            {isMainFlowRendered && (
                <>
                    <Route path={keys.Home} Component={Home} />
                    <Route path={keys.AccountDetails} Component={AccountDetails} />
                    <Route path={keys.Send} Component={Send} />
                    <Route path={keys.TransactionRequest} Component={TransactionRequest} />
                    <Route path={keys.Settings} Component={Settings} />
                </>
            )}
        </Routes>
    );
}
