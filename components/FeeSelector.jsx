import { SelectItem } from '@nextui-org/react';
import { Dropdown } from '.';
import { $t } from '@/localization';


export const FeeSelector = (props) => {
    const { title, fees, ticker, value, onChange } = props;
    const options = [
        {
            label: $t('selector_fee_fast'),
            icon: '/images/fees-fast-3.png',
            value: 'fast',
            fee: fees.fast,
        },
        {
            label: $t('selector_fee_medium'),
            icon: '/images/fees-medium-3.png',
            value: 'medium',
            fee: fees.medium,
        },
        {
            label: $t('selector_fee_slow'),
            icon: '/images/fees-slow-3.png',
            value: 'slow',
            fee: fees.slow,
        },

    ];
    const selectedSpeed = options.find((option) => option.value === value);
    const valueField = selectedSpeed
        ? `${selectedSpeed.label} | ${selectedSpeed.fee} ${ticker}`
        : '...';

    return (
        <Dropdown
            list={options}
            title={title}
            value={value}
            onChange={onChange}
            renderValue={() => valueField}
            renderItem={(option) => (
                <SelectItem
                    key={option.value}
                    description={`${option.fee} ${ticker}`}
                    startContent={<img src={option.icon} className="w-12 h-12 object-contain" />}
                >
                    {option.label}
                </SelectItem>
            )}
        />
    )
};
