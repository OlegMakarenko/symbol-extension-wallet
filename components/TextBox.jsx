import { Input, Textarea } from "@nextui-org/react";

const MULTILINE_NUMBER_OF_LINES = 7;

export const TextBox = (props) => {
    const { contentRight, multiline, title, value, errorMessage, innerRef, onChange } = props;

    if (!multiline) return (
        <Input
            fullWidth
            variant="faded"
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
            fullWidth
            variant="faded"
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
