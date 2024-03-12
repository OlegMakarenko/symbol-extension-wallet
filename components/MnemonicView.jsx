import { $t } from '@/localization';
import { ButtonCopy } from './ButtonCopy';
import { Button, Input, Textarea } from '@nextui-org/react';

export const MnemonicView = (props) => {
    const { isShown, isCopyDisabled, mnemonic, onShowPress } = props;
    const placeholder = '****';
    const mnemonicText = isShown ? mnemonic : placeholder;

    return (
        <div className="relative w-full">
            <Textarea minRows={4} readOnly className="w-full" value={mnemonicText} isDisabled={!isShown} />
            {isShown && !isCopyDisabled && (
                <ButtonCopy content={mnemonicText} className="absolute top-0 right-0" />
            )}
            {!isShown && (
                <Button color="primary" variant="light" onClick={onShowPress} className="absolute top-0 w-full h-full text-center">
                    {$t('button_showMnemonic')}
                </Button>
            )}
        </div>
    );
};
