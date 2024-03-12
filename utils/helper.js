import { NetworkIdentifier } from '@/constants';
import { $t } from '@/localization';
import { toast } from 'react-toastify';

export const showMessage = ({ message, type }) => {
    const toastTypeMap = {
        danger: 'error',
        info: 'info',
        success: 'success',
        warn: 'warn'
    };
    toast[toastTypeMap[type] || toastTypeMap.info](message);
}

export const handleError = (error) => {
    const message = $t(error.message, { defaultValue: error.message });
    showMessage({ message, type: 'danger' });
    console.error(error);
};

export const copyToClipboard = async text => {
	if (navigator.clipboard) {
		return navigator.clipboard.writeText(text);
	}

	const textArea = document.createElement('textarea');
	let success = false;

	textArea.value = text;
	textArea.style.top = '0';
	textArea.style.left = '0';
	textArea.style.position = 'fixed';
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		success = document.execCommand('copy');
	} catch {}

	document.body.removeChild(textArea);

	if (!success) {
		throw Error('Failed to copy to clipboard');
	}
};

export const createNetworkMap = (callback) => {
	const networkIdentifiers = [NetworkIdentifier.TEST_NET, NetworkIdentifier.MAIN_NET];
	const maps = networkIdentifiers.map((networkIdentifier) => [networkIdentifier, callback(networkIdentifier)]);

	return Object.fromEntries(maps);
}

export const trunc = (str, type, length = 5) => {
    const trunc = (text, cut, lengthFirst, lengthSecond) => {
        if (cut === 'start' && lengthFirst < text.length) {
            return '...' + text.substring(text.length - lengthFirst, text.length);
        }
        if (cut === 'middle' && lengthFirst + lengthSecond < text.length) {
            return text.substring(0, lengthFirst) + '...' + text.substring(text.length - lengthSecond, text.length);
        }
        if (cut === 'end' && lengthFirst < text.length) {
            return text.substring(0, lengthFirst) + '...';
        }

        return text;
    };

    if (typeof str !== 'string') {
        return '';
    }

    switch (type) {
        case 'address':
            return trunc(str, 'middle', 6, 3);
        case 'address-short':
            return trunc(str, 'start', 3);
        case 'address-long':
            return trunc(str, 'middle', 12, 12);
        case 'contact':
            return trunc(str, 'end', 18);
        case 'contact-short':
            return trunc(str, 'end', 12);
        case 'hash':
            return trunc(str, 'middle', 12, 12);
        case 'mosaicId':
            return trunc(str, 'middle', 6, 6);
        case 'namespaceName':
            return trunc(str, 'middle', 10, 10);
        default:
            return trunc(str, 'end', length);
    }
};

export const getUserCurrencyAmountText = (amount, price, networkIdentifier) => {
    if (networkIdentifier !== 'mainnet' || !price) {
        return '';
    }

    return `~${(price.value * amount).toFixed(2)} ${price.currency}`;
};

export const getAddressName = (address, currentAccount, accounts, addressBook) => {
    if (!address) {
        return '?';
    }

    if (address === currentAccount.address) {
        return currentAccount.name;
    }
    const walletAccount = accounts.find((account) => address === account.address);

    if (walletAccount) {
        return walletAccount.name;
    }

    // const contact = addressBook.getContactByAddress(address);
    // if (contact) {
    //     return contact.name;
    // }

    return address;
};


export const processRequestAction = async (PersistentStorage, router) => {
    const requestAction = await PersistentStorage.getRequest();
    console.log('requestAction', requestAction);

    if (!requestAction) {
        return;
    }

    if (requestAction.method === 'sign-and-send') {
        router.goToTransactionRequest(requestAction)
    }
}

export const toFixedNumber = (num, digits) => {
    const power = Math.pow(10, digits);

    return Math.round(num * power) / power;
};
