import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@nextui-org/react";
import { TextBox } from "./TextBox";
import { $t } from "@/localization";

const images = [
    ,
    '/images/fees-medium-3.png',
    '/images/fees-fast-3.png',
];

export const FeeSelector = (props) => {
    const { style, title, fees, ticker, value, onChange } = props;
    const options = [
        {
            label: $t('selector_fee_fast'),
            icon: '/images/fees-fast-3.png',
            speed: 'fast',
            value: fees.fast,
        },
        {
            label: $t('selector_fee_medium'),
            icon: '/images/fees-medium-3.png',
            speed: 'medium',
            value: fees.medium,
        },
        {
            label: $t('selector_fee_slow'),
            icon: '/images/fees-slow-3.png',
            speed: 'slow',
            value: fees.slow,
        },

    ];
    const sliderValue = options.map((option) => option.speed).indexOf(value);
    const imageSrc = images[sliderValue];

    const selectedFeeValue = options[sliderValue].value;
    const selectedFeeLabel = options[sliderValue].label;
    const valueField = `${selectedFeeLabel} | ${selectedFeeValue} ${ticker}`;


    const handleChange = (setOfValues) => {
        const value = [...setOfValues.values()][0]
        onChange(value || 'medium');
    };

    return (
        <Dropdown className="bg-main w-full rounded-lg" backdrop="opaque">
            <DropdownTrigger>
                <a className="w-full cursor-pointer">
                    <TextBox
                        title={title}
                        value={valueField}
                    />
                </a>
            </DropdownTrigger>
            <DropdownMenu
                aria-label="Fee selection"
                variant="flat"
                disallowEmptySelection
                selectionMode="single"
                selectedKeys={[value]}
                onSelectionChange={handleChange}
            >
                {options.map((option) => (
                    <DropdownItem
                        key={option.speed}
                        description={`${option.value} ${ticker}`}
                        startContent={<img src={option.icon} className="w-12 h-12 object-contain" />}
                    >
                        {option.label}
                    </DropdownItem>
                ))}
            </DropdownMenu>
        </Dropdown>
    );
};
