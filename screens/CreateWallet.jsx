import { Checkbox, Progress } from '@nextui-org/react';
import { useEffect, useState } from 'react';
import { generateMnemonic } from '@/utils/wallet';
import { $t } from '@/localization';
import { useDataManager, usePasscode, useToggle, useValidation } from '@/utils/hooks';
import { validateAccountName, validateRequired } from '@/utils/validators';
import { TextBox } from '@/components/TextBox';
import { MnemonicView } from '@/components/MnemonicView';
import { WalletCreationAnimation } from '@/components/WalletCreationAnimation';
import { Screen } from '@/components/Screen';
import { FormItem } from '@/components/FormItem';
import { ButtonClose } from '@/components/ButtonClose';
import { handleError } from '@/utils/helper';
import { useRouter } from '@/components/Router';
import { Button } from '@/components/index';
import WalletController from '@/core/WalletController';


export const CreateWallet = () => {
    const router = useRouter();
    const stepsCount = 2;
    const [step, setStep] = useState(1);
    const [name, setName] = useState($t('s_createWallet_defaultAccountName'));
    const [mnemonic, setMnemonic] = useState('');
    const [isMnemonicShown, setIsMnemonicShown] = useState(false);
    const [isRiskAccepted, toggleAcceptRisk] = useToggle(false);
    const nameErrorMessage = useValidation(name, [validateRequired(), validateAccountName()], $t);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(1);
    const loadingSteps = [
        $t('s_createWallet_loading_step1'),
        $t('s_createWallet_loading_step2'),
        $t('s_createWallet_loading_step3'),
        $t('s_createWallet_loading_step4'),
    ];

    const showMnemonic = () => setIsMnemonicShown(true);
    const next = () => (step === stepsCount ? createPasscode() : setStep(step + 1));
    const startLoading = (password) => {
        setIsLoading(true);
        setTimeout(() => setLoadingStep(2), 500);
        setTimeout(() => setLoadingStep(3), 1000);
        setTimeout(() => saveMnemonic(password), 1500);
    };
    const completeLoading = async () => {
        WalletController.notifyLoginCompleted();
    };
    const [saveMnemonic] = useDataManager(
        async (password) => {
            await WalletController.saveMnemonicAndGenerateAccounts({ mnemonic, name }, password);
            setLoadingStep(4);
            setTimeout(completeLoading, 500);
        },
        null,
        handleError
    );
    const [Passcode, createPasscode] = usePasscode(startLoading);

    useEffect(() => {
        const mnemonic = generateMnemonic();
        setMnemonic(mnemonic);
        setStep(1);
    }, []);

    return (
        isLoading
            ? <WalletCreationAnimation steps={loadingSteps} currentStep={loadingStep} />
            : <Screen>
                <ButtonClose type="cancel" className="self-end" onClick={router.goToWelcome}/>
                <FormItem>
                    <img src="/images/logo-symbol-full.png" className="h-12 mx-auto" />
                </FormItem>
                <FormItem>
                    <Progress size="sm" maxValue={stepsCount + 1} value={step} className="w-full my-4"/>
                </FormItem>
                {step === 1 && (
                    <div className="h-full flex flex-col justify-between">
                        <div>
                            <FormItem>
                                <h2>{$t('s_createWallet_accountName_title')}</h2>
                                <p>{$t('s_createWallet_accountName_text')}</p>
                            </FormItem>
                            <FormItem>
                                <TextBox
                                    title={$t('s_createWallet_accountName_input')}
                                    value={name}
                                    errorMessage={nameErrorMessage}
                                    onChange={setName}
                                />
                            </FormItem>
                        </div>
                        <FormItem bottom>
                            <Button title={$t('button_next')} isDisabled={!!nameErrorMessage} onClick={next} />
                        </FormItem>
                    </div>
                )}
                {step === 2 && (
                    <>
                        <FormItem>
                            <h2>{$t('s_createWallet_mnemonic_title')}</h2>
                            <p>{$t('s_createWallet_mnemonic_text_p1')}</p>
                        </FormItem>
                        <FormItem>
                            <p>{$t('s_createWallet_mnemonic_text_p2')}</p>
                        </FormItem>
                        <FormItem>
                            <p>{$t('s_createWallet_mnemonic_text_p3')}</p>
                        </FormItem>
                        <FormItem>
                            <MnemonicView mnemonic={mnemonic} isShown={isMnemonicShown} onShowPress={showMnemonic} />
                        </FormItem>
                        <FormItem>
                            <h2>{$t('s_createWallet_tips_title')}</h2>
                            <p>{$t('s_createWallet_tips_text_p1')}</p>
                        </FormItem>
                        <FormItem>
                            <p>{$t('s_createWallet_tips_text_p2')}</p>
                        </FormItem>
                        <FormItem>
                            <h2>{$t('s_createWallet_confirm_title')}</h2>
                            <Checkbox value={isRiskAccepted} onChange={toggleAcceptRisk}>{$t('s_createWallet_confirm_checkbox')}</Checkbox>
                        </FormItem>
                        <FormItem>
                            <Button title={$t('button_next')} isDisabled={!isRiskAccepted} onClick={next}/>
                        </FormItem>
                    </>
                )}
                <Passcode />
            </Screen>
    );
}
