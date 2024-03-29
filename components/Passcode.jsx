import { Button, ButtonGroup, Input } from '@nextui-org/react';
import { $t } from '@/localization';
import { useState } from 'react';
import { classNames } from '@/styles/class-names';

export const Passcode = ({ onSubmit, onCancel }) => {
    const [password, setPassword] = useState('');

    const handleKeyDown = e => {
        e.key === 'Enter' && submit();
    }
    const submit = () => {
        onSubmit(password)
    }

    return (
        <div className="text-foreground bg-background fixed top-0 left-0 w-full h-full flex flex-col items-center justify-around text-center p-2 z-40">
            <div>
                <h2>Passcode</h2>
                <p>Passcode</p>
            </div>
            <Input variant="faded" label="Password" type="password" value={password} onValueChange={setPassword} onKeyDown={handleKeyDown}/>
            <div className="w-full flex flex-row">
                <ButtonGroup fullWidth>
                    <Button className={classNames.button} color="primary" onClick={submit}>{$t('button_confirm')}</Button>
                    <Button className={classNames.button} onClick={onCancel}>{$t('button_cancel')}</Button>
                </ButtonGroup>
            </div>
        </div>
    )
}
