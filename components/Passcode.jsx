import { Button, ButtonGroup, Input } from '@nextui-org/react';
import { $t } from '@/localization';
import { useState } from 'react';
import { classNames } from '@/styles/class-names';
import { FormItem } from '.';

export const Passcode = ({ type = 'confirm', onSubmit, onCancel }) => {
    const [password, setPassword] = useState('');
    const hasCancelButton = type === 'confirm';
    const textMap = {
        confirm: {
            title: 'Confirm Action',
            button: $t('button_confirm'),
        },
        login: {
            title: 'Welcome Back!',
            button: $t('button_unlock'),
        },
        create: {
            title: 'Create Passcode',
            button: $t('button_continue'),
        }
    };
    const titleText = textMap[type].title;
    const buttonText = textMap[type].button;

    const handleKeyDown = e => {
        e.key === 'Enter' && submit();
    }
    const submit = () => {
        onSubmit(password)
    }

    return (
        <div className="text-foreground bg-background fixed top-0 left-0 w-full h-full flex flex-col items-center justify-around text-center p-2 z-40">
            <div>
                <img src="/images/logo-symbol.png" className="h-20 mx-auto mb-8" />
                <h2>{titleText}</h2>
                <p>Enter Passcode</p>
            </div>
            <Input
                size="lg"
                variant="underlined"
                label="Password"
                type="password"
                color="secondary"
                value={password}
                className="border-b-secondary"
                onValueChange={setPassword}
                onKeyDown={handleKeyDown}
            />
            <div className="w-full flex flex-row">
                <ButtonGroup fullWidth>
                    <Button className={classNames.button} color="primary" onClick={submit}>
                        {buttonText}
                    </Button>
                    {hasCancelButton && (
                        <Button className={classNames.button} onClick={onCancel}>
                            {$t('button_cancel')}
                        </Button>
                    )}
                </ButtonGroup>
            </div>
        </div>
    )
}
