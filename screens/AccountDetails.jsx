import { Card } from '@/components/Card';
import { FormItem } from '@/components/FormItem';
import { Screen } from '@/components/Screen';
import { TableView } from '@/components/TableView';
import { TitleBar } from '@/components/TitleBar';
import { config } from '@/config';
import { $t } from '@/localization';
import { Button } from '@nextui-org/react';
import { connect } from 'react-redux';


export const AccountDetails = connect((state) => ({
    currentAccount: state.account.current,
    multisigAddresses: state.account.multisigAddresses,
    networkIdentifier: state.network.networkIdentifier,
}))(function AccountDetails(props) {
    const { currentAccount, multisigAddresses, networkIdentifier } = props;
    const { index, ...restAccountInfo } = currentAccount;
    const tableData = {
        ...restAccountInfo,
        seedIndex: index,
    };
    if (multisigAddresses.length) {
        tableData.multisigAddresses = multisigAddresses;
    }
    const isTestnet = networkIdentifier === 'testnet';

    const openBlockExplorer = () => window.open(config.explorerURL[networkIdentifier] + '/accounts/' + currentAccount.address, '_blank');
    const openFaucet = () => window.open(config.faucetURL + '/?recipient=' + currentAccount.address, '_blank');

    return (
        <Screen
            titleBar={<TitleBar hasBackButton hasSettingsButton />}
            bottomComponent={
                <div>
                    {isTestnet && (
                        <FormItem>
                            <Button variant="light" color="primary" onClick={openFaucet}>
                                <img src="/images/icon-primary-faucet.png" className="w-4 h-4" />
                                {$t('button_faucet')}
                            </Button>
                        </FormItem>
                    )}
                    <FormItem>
                        <Button variant="light" color="primary" onClick={openBlockExplorer}>
                            <img src="/images/icon-primary-explorer.png" className="w-4 h-4" />
                            {$t('button_openTransactionInExplorer')}</Button>
                    </FormItem>
                </div>
            }
        >
            <FormItem>
                <Card>
                    <FormItem>
                        <TableView data={tableData} rawAddresses />
                    </FormItem>
                </Card>
            </FormItem>
        </Screen>
    );
});
