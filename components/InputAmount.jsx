import { useEffect, useState } from 'react';
import { DialogBox, TextBox } from '@/components/index';
import { $t } from '@/localization';
import { getUserCurrencyAmountText } from '@/utils/helper';
import { useToggle, useValidation } from '@/utils/hooks';
import { validateAmount } from '@/utils/validators';

export const InputAmount = (props) => {
    const { title, value, price, networkIdentifier, availableBalance, onChange, onValidityChange } = props;
    const errorMessage = useValidation(value, [validateAmount(availableBalance)], $t);
    const isAvailableBalanceShown = availableBalance !== undefined;
    const [isConfirmVisible, toggleConfirm] = useToggle(false);
    const [priceText, setPriceText] = useState('');
    const availableBalanceTextStyle = availableBalance ? 'text-primary' : 'text-danger';

    const handleChange = (str) => {
        const formattedStr = str
            .replace(/,/g, '.')
            .replace(/[^.\d]/g, '')
            .replace(/^(\d*\.?)|(\d*)\.?/g, '$1$2');
        onChange(formattedStr);
    };
    const setMax = () => {
        handleChange('' + availableBalance);
        toggleConfirm();
    };

    useEffect(() => {
        onValidityChange && onValidityChange(!errorMessage);
        setPriceText(getUserCurrencyAmountText(value, price, networkIdentifier));
    }, [value, errorMessage, price, networkIdentifier]);

    return (
        <>
            <TextBox
                title={title}
                errorMessage={errorMessage}
                value={value}
                onChange={handleChange}
                contentRight={
                    <div className="flex flex-col items-end">
                        {!!priceText && <p className="text-default-500 min-w-60 text-right">{priceText}</p>}
                        {isAvailableBalanceShown && (
                            <button
                                onClick={toggleConfirm}
                                disabled={!availableBalance}
                                className={['min-w-60 text-right', availableBalanceTextStyle].join(' ')}
                            >
                                    {$t('c_inputAmount_label_available')}: {availableBalance}
                            </button>
                        )}
                    </div>
                }
            />
            <DialogBox
                type="confirm"
                title={$t('c_inputAmount_confirm_title')}
                text={$t('c_inputAmount_confirm_text', { amount: availableBalance })}
                isVisible={isConfirmVisible}
                onSuccess={setMax}
                onCancel={toggleConfirm}
            />
        </>
    );
};
