import { useState } from 'react';
import { createOptInPrivateKeyFromMnemonic } from '@/utils/wallet';
import { $t } from '@/localization';
import { useDataManager, usePasscode, useValidation } from '@/utils/hooks';
import { validateMnemonic, validateRequired } from '@/utils/validators';
import { TextBox } from '@/components/TextBox';
import { WalletCreationAnimation } from '@/components/WalletCreationAnimation';
import { Screen } from '@/components/Screen';
import { FormItem } from '@/components/FormItem';
import { ButtonClose } from '@/components/ButtonClose';
import { handleError } from '@/utils/helper';
import { useRouter } from '@/components/Router';
import { Button } from '@/components/index';
import WalletController from '@/core/WalletController';

export const ImportWallet = () => {
    const router = useRouter();
    const [name] = useState($t('s_importWallet_defaultAccountName'));
    const [mnemonic, setMnemonic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(1);
    const mnemonicErrorMessage = useValidation(mnemonic, [validateRequired(), validateMnemonic()], $t);
    const isButtonDisabled = !!mnemonicErrorMessage;
    const loadingSteps = [
        $t('s_importWallet_loading_step1'),
        $t('s_importWallet_loading_step2'),
        $t('s_importWallet_loading_step3'),
        $t('s_importWallet_loading_step4'),
        $t('s_importWallet_loading_step5'),
    ];

    const handleMnemonicChange = (str) => {
        const formattedString = str
            .replace(/(\r\n|\n|\r)/gm, ' ')
            .replace(/\s+/g, ' ')
            .toLowerCase();

        setMnemonic(formattedString);
    }
    const next = () => createPasscode();
    const [checkOptInAccounts] = useDataManager(
        async (password) => {
            const optInPrivateKey = createOptInPrivateKeyFromMnemonic(mnemonic);
            setLoadingStep(4);
            setTimeout(() => saveMnemonic(password, optInPrivateKey), 500);
        },
        null,
        handleError
    );
    const [saveMnemonic] = useDataManager(
        async (password, optInPrivateKey) => {
            await WalletController.saveMnemonicAndGenerateAccounts({
                mnemonic: mnemonic.trim(),
                name,
                optInPrivateKey
            }, password);
            setLoadingStep(5);
            setTimeout(completeLoading, 500);
        },
        null,
        handleError
    );
    const startLoading = (password) => {
        setIsLoading(true);
        setTimeout(() => setLoadingStep(2), 500);
        setTimeout(() => setLoadingStep(3), 1000);
        setTimeout(() => checkOptInAccounts(password), 1500);
    };
    const completeLoading = async () => {
        WalletController.notifyLoginCompleted();
    };
    const [Passcode, createPasscode] = usePasscode(startLoading);

    return (
        isLoading
            ? <WalletCreationAnimation steps={loadingSteps} currentStep={loadingStep} />
            : <Screen bottomComponent={(
                <FormItem>
                    <Button title={$t('button_next')} isDisabled={isButtonDisabled} onClick={next} />
                </FormItem>
            )}>
                <ButtonClose type="cancel" className="self-end" onClick={router.goToWelcome}/>
                <FormItem>
                    <img src="/images/logo-symbol-full.png" className="h-12 mx-auto" />
                </FormItem>
                <FormItem>
                    <h2 type="title">{$t('s_importWallet_title')}</h2>
                    <p type="body">{$t('s_importWallet_text')}</p>
                </FormItem>
                <FormItem>
                <TextBox
                    multiline
                    value={mnemonic}
                    onChange={handleMnemonicChange}
                    errorMessage={mnemonicErrorMessage}
                />
                </FormItem>
                <Passcode />
            </Screen>
    );
};
