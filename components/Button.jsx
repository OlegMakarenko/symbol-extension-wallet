import { classNames } from "@/styles/class-names";
import { Button as ButtonNext } from "@nextui-org/react";

export const Button = (props) => {
    const { isDisabled, title, onClick, color = 'primary', wrap, isSecondary } = props;

    return (
        <ButtonNext
            fullWidth={!wrap}
            color={color}
            variant={isSecondary ? 'bordered' : undefined}
            isDisabled={isDisabled}
            onClick={onClick}
            className={classNames.button}
        >
            {title}
        </ButtonNext>
    )
};
