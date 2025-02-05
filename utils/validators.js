import { isSymbolAddress } from './account';
import { ExtensionRpcMethods } from '@/constants';
import { isInteger } from 'lodash';
import { Bip32 } from 'symbol-sdk';

export const validateRequired =
    (isRequired = true) =>
    (str) => {
        if (isRequired && str.length === 0) {
            return 'validation_error_field_required';
        }
    };

export const validateAccountName = () => (str) => {
    if (str.length > 15) {
        return 'validation_error_contact_name_long';
    }
};

export const validateKey = () => (str) => {
    if (str.length !== 64) {
        return 'validation_error_key_length';
    }
};

export const validateMnemonic = () => (str) => {
    let isValidMnemonic;
    const bip = new Bip32();

    try {
        bip.fromMnemonic(str.trim(), '');
        isValidMnemonic = true;
    }
    catch {
        isValidMnemonic = false;
    }

    if (!isValidMnemonic) {
        return 'validation_error_mnemonic_invalid';
    }
};

export const validateUnresolvedAddress = () => (str) => {
    if (str.length < 1) {
        return 'validation_error_address_short';
    }
};

export const validateAddress = () => (str) => {
    if (!isSymbolAddress(str)) {
        return 'validation_error_address_invalid';
    }
};

export const validateAmount = (availableBalance) => (str) => {
    if (parseFloat(str) > parseFloat(availableBalance)) {
        return 'validation_error_balance_not_enough';
    }
};

export const validateExisted = (existedValues) => (str) => {
    if (existedValues.some((value) => value === str)) {
        return 'validation_error_already_exists';
    }
};

export const validateMosaicSupply = () => (str) => {
    const numeric = +str;

    if (!Number.isInteger(numeric) || numeric < 1 || numeric > 9999999999) {
        return 'validation_error_mosaic_supply';
    }
};

export const validateMosaicDivisibility = () => (str) => {
    const numeric = +str;

    if (!Number.isInteger(numeric) || numeric < 0 || numeric > 6) {
        return 'validation_error_mosaic_divisibility';
    }
};

export const validateMosaicDuration = (blockGenerationTargetTime) => (str) => {
    const numeric = +str;

    if (!Number.isInteger(numeric) || numeric < 1 || numeric > (3650 * 86400) / blockGenerationTargetTime) {
        return 'validation_error_mosaic_duration';
    }
};

export const validateRequestAction = () => (obj) => {
    const { sender, method, timestamp } = obj;

    if (!sender || !sender.origin || !sender.icon || !sender.title) {
        return 'validation_error_requestAction_sender';
    }
    if (!Object.values(ExtensionRpcMethods).some(rpcMethod => rpcMethod === method)) {
        return 'validation_error_requestAction_method';
    }
    if (!isInteger(timestamp)) {
        return 'validation_error_requestAction_timestamp';
    }
}
