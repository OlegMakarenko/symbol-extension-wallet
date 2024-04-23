import { trunc } from '@/utils/helper';
import React from 'react';
import { $t } from '@/localization';
import { Card } from './Card';
import { Chip, Divider } from '@nextui-org/react';

export function ItemAsset(props) {
    const { group, asset, chainHeight, blockGenerationTargetTime, onPress, nativeMosaicId } = props;
    const { amount, name, id, startHeight, isUnlimitedDuration } = asset;
    const amountText = amount ? amount : '';
    let description;
    let iconSrc;
    let endHeight;

    if (group === 'mosaic') {
        description = $t('s_assets_item_id', { id });
        iconSrc =
            id === nativeMosaicId
                ? '/images/icon-mosaic-native.png'
                : '/images/icon-mosaic-custom.png';
        endHeight = asset.startHeight + asset.duration;
    } else if (group === 'namespace') {
        const linkedId = asset.linkedMosaicId || asset.linkedAddress;
        description = linkedId ? $t('s_assets_item_linkedTo', { id: trunc(linkedId, 'address') }) : $t('s_assets_item_notLinked');
        iconSrc = '/images/icon-namespace.png';
        endHeight = asset.endHeight;
    }

    const isExpired = !isUnlimitedDuration && chainHeight >= endHeight;
    ///$t('s_assets_item_expired')

    return (
        <Card>
            <div className="relative">
                <img src={iconSrc} className="w-24 h-24 mx-auto" />
                <Divider className="my-4" />
                <h4 className="w-full truncate ... opacity-70">{name}</h4>
                <p>{amount}</p>
                {isExpired && <Chip color="warning" variant="solid" className="absolute top-0 right-0">{$t('s_assets_item_expired')}</Chip>}
            </div>

        </Card>
    );
}
