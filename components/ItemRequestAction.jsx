import { config } from '@/config';
import { Button, Card } from '@/components/index';
import { $t } from '@/localization';
import { connect } from '@/store';
import { validateRequestAction } from '@/utils/validators';
import { Divider } from '@nextui-org/react';
import Countdown from 'react-countdown';

export const ItemRequestAction = connect((state) => ({
    currentAccount: state.account.current,
    walletAccounts: state.wallet.accounts,
    networkIdentifier: state.network.networkIdentifier,
    ticker: state.network.ticker,
}))(function ItemRequestAction(props) {
    const { request, onDetailsClick, onCancelClick } = props;
    const { sender, method, timestamp } = request;
    const errorMessage = validateRequestAction()(request);

    const title = $t(`extensionMethod_${method}`);
    const description = $t(`extensionMethod_${method}_description`);

    return (
        <Card className="relative overflow-hidden">
            {!!errorMessage && <h3>{errorMessage}</h3>}
            {!errorMessage && (
                <div>
                    <div className="absolute top-0 left-0 w-full bg-panel">
                        <div className="relative w-full h-16 flex flex-row px-4 py-2">
                            <div className="flex flex-col justify-center flex-shrink-0 pr-4">
                                <img src={sender.icon} className="w-8 h-8 flex-shrink-0" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <p className="font-mono leading-tight truncate ...">{sender.title}</p>
                                <p className="font-mono opacity-70 leading-tight truncate ...">{sender.origin}</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-12 mb-4" />
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <div className="flex flex-col justify-between items-end pl-4">
                        <Countdown
                            className="font-mono text-small opacity-70"
                            daysInHours
                            date={timestamp + config.actionRequestDeadline}
                        />
                    </div>
                    <Divider className="my-4" />
                    <div className="flex flex-row gap-4">
                        <Button
                            onClick={() => onDetailsClick(request)}
                            color="primary"
                            title={$t('button_showDetails')} />
                        <Button onClick={() => onCancelClick(request)} isSecondary title={$t('button_cancel')}  />
                    </div>
                </div>
            )}
        </Card>
    );
});
