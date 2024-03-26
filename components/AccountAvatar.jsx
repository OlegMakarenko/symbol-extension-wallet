import { knownAccounts } from '@/config';
import { KNOWN_ACCOUNT_IMAGES } from '@/constants';
import { getImageFromHash } from '@/utils/helper';
import { useEffect, useState } from 'react';

export const AccountAvatar = ({ address = '', size, className }) => {
    const [bgBlockie, setBgBlockie] = useState('');
    const [logo, setLogo] = useState('');
    const rootStyle = ['rounded-full overflow-hidden'];

    switch (size) {
        default:
        case 'sm':
            rootStyle.push('w-8 h-8');
            break;
        case 'md':
            rootStyle.push('w-14 h-14');
            break;
        case 'lg':
            rootStyle.push('w-40 h-40');
            break;
    }

    useEffect(() => {
        if (knownAccounts.hasOwnProperty(address) && KNOWN_ACCOUNT_IMAGES[knownAccounts[address]]) {
            setLogo(KNOWN_ACCOUNT_IMAGES[knownAccounts[address]]);
        }
        else {
            setBgBlockie(getImageFromHash(address));
        }
	}, [address]);

	return (
		<div className={[...rootStyle, className].join(' ')}>
			{!!bgBlockie && <img src={bgBlockie} className="w-full h-full animation-fade-in object-cover" />}
			<img className="w-1/2 h-1/2" src="/images/icon-account.svg" alt="Account" />
            {!!logo && <img src={logo} className="w-full h-full animation-fade-in object-cover" />}
		</div>
	);
};
