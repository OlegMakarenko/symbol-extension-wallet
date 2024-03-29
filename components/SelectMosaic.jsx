import { Dropdown } from '@/components/index';
import { SelectItem } from '@nextui-org/react';

export const SelectMosaic = (props) => {
    const { title, value, list, chainHeight, onChange } = props;

    const availableMosaicList = list.filter((item) => item.mosaicInfo.endHeight > chainHeight || !item.mosaicInfo.duration);

    const getImageSrc = (item) =>
        item.mosaicInfo.name === 'symbol.xym'
            ? '/images/icon-select-mosaic-native.png'
            : '/images/icon-select-mosaic-custom.png';

    return (
        <Dropdown
            title={title}
            value={value}
            list={availableMosaicList}
            onChange={onChange}
            renderItem={(item) => (
                <SelectItem
                    key={item.mosaicInfo.id}
                    description={item.mosaicInfo.amount}
                    startContent={<img src={getImageSrc(item)} className="w-8 h-8" />}
                >
                    {item.label}
                </SelectItem>
            )}
        />
    );
};
