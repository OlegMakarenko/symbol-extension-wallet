
import { Button, Card, FormItem, Screen, TitleBar } from '@/components/index';
import { WalletController } from '@/core/WalletController';
import { $t } from '@/localization';
import { connect } from '@/store';
import { handleError } from '@/utils/helper';
import { useDataManager } from '@/utils/hooks';
import { Accordion, AccordionItem } from '@nextui-org/react';
import { useEffect } from 'react';

export const SettingsPermissions = connect((state) => ({
}))(function SettingsPermissions(props) {
    const [loadState, isLoading, permissions] = useDataManager(
        async () => WalletController.getPermissions(),
        [],
        handleError
    );
    useEffect(() => {
        loadState();
    }, []);

    const removePermission = async (origin, permission) => {
        await WalletController.removePermission(origin, permission);
        loadState();
    }

    return (
        <Screen titleBar={<TitleBar hasBackButton />}>
            <FormItem>
                <h2>{$t('s_settings_item_permission_title')}</h2>
            </FormItem>
            <Accordion isCompact>
                {Object.keys(permissions || []).map(origin => (
                    <AccordionItem key={origin} aria-label={origin} title={origin}>
                        {permissions[origin].map(permission => (
                            <FormItem>
                                <Card>
                                    <div className="flex flex-row justify-between w-full">
                                        <div>
                                            <h3>{$t(`extensionPermission_${permission}`)}</h3>
                                            <p>{$t(`extensionPermission_${permission}_description`)}</p>
                                        </div>
                                        <Button
                                            color="danger"
                                            isSecondary
                                            wrap
                                            title={$t('button_remove')}
                                            onClick={() => removePermission(origin, permission)}
                                        />
                                    </div>
                                </Card>
                            </FormItem>
                        ))}
                    </AccordionItem>
                ))}

            </Accordion>

        </Screen>
    );
});
