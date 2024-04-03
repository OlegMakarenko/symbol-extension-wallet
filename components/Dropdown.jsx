import { classNames } from '@/styles/class-names';
import { Select, SelectItem } from '@nextui-org/react';

export const Dropdown = (props) => {
    const { title, value, list, renderItem, renderValue, onChange } = props;

    const valueText = list.find((item) => item.value === value)?.label || value;

    const handleChange = (setOfValues) => {
        const value = [...setOfValues.values()][0]
        onChange(value);
    };

    return (
        <Select
            items={list}
            label={title}
            classNames={{ trigger: classNames.controlWrapper, selectorIcon: 'w-6 h-6' }}
            listboxProps={{
                itemClasses: {
                    base: classNames.listItemBase
                }
            }}
            variant="faded"
            disallowEmptySelection
            selectionMode="single"
            selectedKeys={[value]}
            selectorIcon={<img src="/images/icon-down.png" className="w-6 h-6" />}
            onSelectionChange={handleChange}
            renderValue={renderValue ? renderValue : () => valueText}
        >
            {(item, index) => (renderItem
                ? renderItem(item, index)
                : (
                <SelectItem key={item.value} textValue={item.label}>
                    <p>{item.label}</p>
                </SelectItem>
            ))}
        </Select>
    );
};
