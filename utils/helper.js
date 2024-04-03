import { NetworkIdentifier } from '@/constants';
import { $t } from '@/localization';
import { toast } from 'react-toastify';
import makeBlockie from 'ethereum-blockies-base64';

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
    } catch { }

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

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @returns {object} {R: Number, G: Number, B: Number}
 */
export const hslToRgb = (h, s, l) => {
    let r, g, b;

    const hue2rgb = (_p, _q, _t) => {
        if (0 > _t) _t += 1;
        if (1 < _t) _t -= 1;
        if (_t < 1 / 6) return _p + (_q - _p) * (6 * _t);
        if (_t < 1 / 2) return _q;
        if (_t < 2 / 3) return _p + (_q - _p) * ((2 / 3 - _t) * 6);
        return _p;
    };

    if (0 === s) {
        r = g = b = l; // achromatic
    } else {
        const q = 0.5 > l ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        R: Math.round(r * 255),
        G: Math.round(g * 255),
        B: Math.round(b * 255),
    };
};


/**
 * Get RGB color from hash.
 * @param {string} hash - hash to be converted.
 * @param {boolean} isHex - default true
 * @returns {object} { R: Number, G: Number, B: Number }
 */
export const getColorFromHash = (hash) => {
    if (!hash) {
        return '#fff';
    }

    const spread = 100;
    const saturation = 0.9;
    const lightness = 0.8;
    const charset = [...'0123456789abcdefghijklmnopqrstuvwxyz'];

    let totalValue = 0;

    for (const char of hash) totalValue += charset.indexOf(char.toLowerCase());

    const k = Math.trunc(totalValue / spread);
    const offsetValue = totalValue - spread * k;
    const hue = offsetValue / 100;

    const color = hslToRgb(hue, saturation, lightness);

    return `rgb(${color.R}, ${color.G}, ${color.B})`;
};

export const getImageFromHash = (hash) => {
    return makeBlockie(hash.toLowerCase())
}

export const formatDate = (dateStr, translate, showTime = false, showSeconds = false) => {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    const addZero = (num) => {
        return 0 <= num && 10 > num ? '0' + num : num + '';
    };

    const dateObj = new Date(dateStr);
    const seconds = addZero(dateObj.getSeconds());
    const minutes = addZero(dateObj.getMinutes());
    const hour = addZero(dateObj.getHours());
    const month = 'function' === typeof translate ? translate('month_' + months[dateObj.getMonth()]) : months[dateObj.getMonth()];
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();

    let formattedDate = `${month} ${day}, ${year}`;

    formattedDate += showTime ? ` ${hour}:${minutes}` : '';
    formattedDate += showTime && showSeconds ? `:${seconds}` : '';

    return formattedDate;
};
