import { classNames } from '@/styles/class-names';
import { Input, Textarea } from '@nextui-org/react';

const MULTILINE_NUMBER_OF_LINES = 7;

export const TextBox = (props) => {
    const { contentRight, multiline, title, value, isDisabled, isReadOnly, errorMessage, onChange } = props;

    if (!multiline) return (
        <Input
            classNames={{ inputWrapper: classNames.controlWrapper, label: classNames.controlLabel }}
            fullWidth
            variant="faded"
            isDisabled={isDisabled}
            isReadOnly={isReadOnly}
            label={title}
            value={value}
            isInvalid={!!errorMessage}
            errorMessage={errorMessage}
            endContent={contentRight}
            onValueChange={onChange}
        />
    )
    else return (
        <Textarea
            classNames={{ inputWrapper: classNames.controlWrapper, label: classNames.controlLabel }}
            fullWidth
            variant="faded"
            isDisabled={isDisabled}
            isReadOnly={isReadOnly}
            label={title}
            value={value}
            isInvalid={!!errorMessage}
            errorMessage={errorMessage}
            endContent={contentRight}
            onValueChange={onChange}
            minRows={MULTILINE_NUMBER_OF_LINES}
        />
    );
};
