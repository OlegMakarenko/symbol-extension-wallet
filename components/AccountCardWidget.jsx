import { $t } from '@/localization';
import { getUserCurrencyAmountText } from '@/utils/helper';
import { useToggle } from '@/utils/hooks';
import { validateAccountName, validateRequired } from '@/utils/validators';
import { Button } from '@nextui-org/react';
import { LoadingIndicator } from './LoadingIndicator';
import { ButtonCopy } from './ButtonCopy';
import { FormItem } from './FormItem';
import { AccountAvatar } from './AccountAvatar';
import { classNames } from '@/styles/class-names';
import { DialogBox } from './DialogBox';

export const AccountCardWidget = (props) => {
    const {
        address,
        balance,
        name,
        ticker,
        price,
        networkIdentifier,
        isLoading,
        onNameChange,
        onReceivePress,
        onSendPress,
        onDetailsPress,
    } = props;
    const [isNameEditShown, toggleNameEdit] = useToggle(false);
    const nameValidators = [validateRequired(), validateAccountName()];
    const userCurrencyBalanceText = getUserCurrencyAmountText(balance, price, networkIdentifier);

    const handleNameChange = (newName) => {
        toggleNameEdit();
        onNameChange(newName);
    };

    return (
        <div className="overflow-hidden relative w-full rounded-lg bg-secondary">
            {isLoading && <LoadingIndicator className="absolute top-0 left-0 w-full h-full" />}
            <AccountAvatar address={address} className="!absolute top-0 left-0 w-full h-full rounded-none opacity-10"/>
            <div className="account-card-gradient absolute top-0 left-0 w-full h-full" />
            <div className="relative w-full p-4">
                <FormItem>

                </FormItem>
                <div className="mt-4 font-mono uppercase opacity-70 leading-tight" >{$t('c_accountCard_title_account')}</div>
                <div className="flex flex-row items-center">
                    <div className="s-text-title">{name}</div>
                    <div className="px-2 cursor-pointer" onClick={toggleNameEdit}>
                        <img className="w-6 h-6" src="/images/icon-edit.png" />
                    </div>
                </div>
                <div className="mt-4 font-mono uppercase opacity-70 leading-tight">{$t('c_accountCard_title_balance')}</div>
                <div className="flex flex-row items-baseline">
                    <div className="text-4xl">{balance}</div>
                    <div className="text-xl">{' ' + ticker}</div>
                </div>
                <div className="text-xl" style={{ opacity: !!userCurrencyBalanceText ? 1 : 0 }}>{userCurrencyBalanceText || '...'}</div>
                <div className="mt-4 font-mono uppercase opacity-70 leading-tight">{$t('c_accountCard_title_address')}</div>
                <div className="flex flex-row items-center">
                    <div className="mr-2">{address}</div>
                    <ButtonCopy content={address} />
                </div>
            </div>
            <div className="relative overflow-hidden flex flex-row rounded-bl-lg rounded-br-lg">
                <div className="flex-1 h-14 bg-secondary-700 border-r-1.5 border-secondary">
                    <Button
                        color="secondary"
                        className={[...classNames.button, 'bg-secondary-700 w-full h-full']}
                        onClick={onDetailsPress}
                    >
                        <img src="/images/icon-wallet.png" className="w-5 h-5" />
                        <div>{$t('c_accountCard_button_accountDetails')}</div>
                    </Button>
                </div>
                <div className="flex-1 h-14 bg-secondary-700 border-r-1.5 border-secondary">
                    <Button
                        color="secondary"
                        className={[...classNames.button, 'bg-secondary-700 w-full h-full']}
                        onClick={onSendPress}
                    >
                        <img src="/images/icon-send.png" className="w-5 h-5" />
                        <div>{$t('c_accountCard_button_send')}</div>
                    </Button>
                </div>
                <div className="flex-1 h-14 bg-secondary-700">
                    <Button
                        color="secondary"
                        className={[...classNames.button, 'bg-secondary-700 w-full h-full']}
                        onClick={onReceivePress}
                    >
                        <img src="/images/icon-receive.png" className="w-5 h-5" />
                        <div>{$t('c_accountCard_button_receive')}</div>
                    </Button>
                </div>
            </div>
            <DialogBox
                type="prompt"
                title={$t('c_accountCard_prompt_title')}
                text={$t('c_accountCard_prompt_text')}
                promptValidators={nameValidators}
                isVisible={isNameEditShown}
                onSuccess={handleNameChange}
                onCancel={toggleNameEdit}
            />
        </div>
    );
};
