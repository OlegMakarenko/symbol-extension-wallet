import { observer } from 'mobx-react-lite';
import { $t } from '@/localization';
import Controller from '@/core/Controller';

export const ConnectionStatus = observer(function ConnectionStatus() {
    const { networkStatus, isStateReady } = Controller;
    const heightExpanded = 'h-4';
    const heightCollapsed = 'h-0';

    const networkStatusMap = {
        'initial': {
            text: $t('c_connectionStatus_connecting'),
            color: 'bg-warning',
            height: heightExpanded,
        },
        'offline': {
            text: $t('c_connectionStatus_offline'),
            color: 'bg-danger',
            height: heightExpanded,
        },
        'failed-auto': {
            text: $t('c_connectionStatus_connecting'),
            color: 'bg-warning',
            height: heightExpanded,
        },
        'failed-current': {
            text: $t('c_connectionStatus_connecting'),
            color: 'bg-warning',
            height: heightExpanded,
        },
        'connected': {
            text: $t('c_connectionStatus_connected'),
            color: 'bg-info',
            height: heightCollapsed,
        },
    };

    const status = networkStatusMap[networkStatus];

    if (isStateReady) {
        return (
            <div className={`w-full flex justify-center items-center transition-height delay-500 ${status.color} ${status.height}`}>
                <p className="w-full text-center font-semibold text-background text-xs pt-px">{status.text}</p>
            </div>
        );
    }

    return null;
});
