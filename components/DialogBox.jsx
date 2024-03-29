import { $t } from '@/localization';
import { useValidation } from '@/utils/hooks';
import { Button, Modal, ModalBody, ModalContent } from '@nextui-org/react';
import { useEffect, useState } from 'react';
import { TextBox } from './TextBox';

export const DialogBox = (props) => {
    const { isVisible, type, title, text, body, promptValidators, onSuccess, onCancel  } = props;
    const [promptValue, setPromptValue] = useState('');
    const promptErrorMessage = useValidation(promptValue, promptValidators || [], $t);
    const isPromptValueValid = !promptErrorMessage;

    const buttonOk = {
        text: $t('button_ok'),
        handler: onSuccess,
        color: 'secondary',
    };
    const buttonPromptOk = {
        text: $t('button_ok'),
        handler: () => isPromptValueValid && onSuccess(promptValue),
        color: 'secondary',
    };
    const buttonConfirm = {
        text: $t('button_confirm'),
        handler: onSuccess,
        color: 'secondary',
    };
    const buttonAccept = {
        text: $t('button_accept'),
        handler: onSuccess,
        color: 'secondary',
    };
    const buttonCancel = {
        text: $t('button_cancel'),
        handler: onCancel,
        color: 'default',
    };
    const buttons = [];
    const isPrompt = type === 'prompt';

    switch (type) {
        case 'prompt':
            buttons.push(buttonPromptOk, buttonCancel);
            break;
        case 'accept':
            buttons.push(buttonAccept);
            break;
        case 'confirm':
            buttons.push(buttonConfirm, buttonCancel);
            break;
        case 'alert':
        default:
            buttons.push(buttonOk);
            break;
    }

    useEffect(() => setPromptValue(''), [isVisible]);

    return (
        <Modal hideCloseButton shouldBlockScroll placement="center" className="bg-main" radius="lg" isOpen={isVisible} onOpenChange={onCancel}>
            <ModalContent>
                <ModalBody>
                    <h2>{title}</h2>
                    {text && !isPrompt && <p>{text}</p>}
                    {body}
                    {isPrompt && (
                        <TextBox title={text} errorMessage={promptErrorMessage} value={promptValue} onChange={setPromptValue} />
                    )}
                </ModalBody>
                <div className="flex flex-row overflow-hidden rounded-b-xl">
                    {buttons.map((button, index) => (
                        <Button
                            disableAnimation
                            className="flex-1 rounded-none"
                            color={button.color}
                            key={'modalbtn' + index}
                            onClick={button.handler}
                        >
                            {button.text}
                        </Button>
                    ))}
            </div>
            </ModalContent>
        </Modal>
    );
};
