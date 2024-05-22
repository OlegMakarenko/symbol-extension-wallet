import { Passcode } from '@/components/Passcode';
import { useEffect, useMemo, useState } from 'react';
import { showMessage } from './helper';
import transaction from 'store/transaction';
import { getTransactionFees } from './transaction';
import { TransactionType } from '@/constants';

export const usePasscode = (onSubmit, onCancel, type = 'confirm') => {
    const [isVisible, setIsVisible] = useState(false);
    const [args, setArgs] = useState(undefined);

    const showPasscode = (...args) => {
        setIsVisible(true);
        setArgs([...args]);
    }
    const handleCancel = () => {
        setIsVisible(false);
        setArgs(undefined);
        onCancel && onCancel()
    };
    const handleSubmit = async (password) => {
        try {
            await onSubmit(password, ...args);
            setIsVisible(false);
            setArgs(undefined);
        }
        catch(e) {
            console.error(e);
            showMessage({type: 'danger', message: e.message})
        }
    }
    const Component = () => isVisible && <Passcode onSubmit={handleSubmit} onCancel={handleCancel} type={type} />

    return [Component, showPasscode];
};

export const useValidation = (value, validators, formatResult) => {
    for (const validator of validators) {
        const validationResult = validator(value);
        if (validationResult && formatResult) {
            return formatResult(validationResult);
        }

        if (validationResult) {
            return validationResult;
        }
    }
};

export const usePromises = (initialPromiseMap, errorHandler) => {
    const [promiseMap, setPromiseMap] = useState(initialPromiseMap);

    const runPromise = () => {
        setTimeout(async () => {
            for (const promiseKey in promiseMap) {
                const promise = promiseMap[promiseKey];

                if (promise) {
                    try {
                        await promise();
                    } catch (error) {
                        if (errorHandler) {
                            errorHandler(error);
                        }
                    }

                    const updatedPromiseMap = { ...promiseMap };
                    updatedPromiseMap[promiseKey] = null;
                    setPromiseMap(updatedPromiseMap);
                    break;
                }
            }
        });
    };

    useEffect(() => {
        runPromise();
    }, [promiseMap]);

    return [promiseMap, setPromiseMap];
};

export const useDataManager = (callback, defaultData, onError) => {
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState(defaultData);

    const call = (...args) => {
        setIsLoading(true);
        setTimeout(async () => {
            try {
                const data = await callback(...args);
                setData(data);
            } catch (error) {
                if (onError) {
                    onError(error);
                }
            }
            setIsLoading(false);
        });
    };

    return [call, isLoading, data];
};

export const useProp = (prop, initValue) => {
    const [value, setValue] = useState(prop === undefined ? initValue : prop);

    useEffect(() => {
        if (prop !== undefined) {
            setValue(prop);
        }
    }, [prop]);

    return [value, setValue];
};

export const useInit = (callback, isReady, deps = []) => {
    useEffect(() => {
        if (isReady) {
            callback();
        }
    }, [isReady, ...deps]);
};

export const useToggle = (initialValue) => {
    const [value, setValue] = useState(initialValue);

    const toggle = () => setValue((value) => !value);

    return [value, toggle];
};


export const useTransactionFees = (transaction, networkProperties) => {
    const defaultTransactionFees = {
        fast: 0,
        medium: 0,
        slow: 0
    };
    const deps = [networkProperties];

    if (transaction.type === TransactionType.TRANSFER) {
        deps.push(...[transaction.message?.text, transaction.messageEncrypted])
    }

    return useMemo(() => networkProperties.networkIdentifier ? getTransactionFees(transaction, networkProperties) : defaultTransactionFees, deps);
}

export const useAsyncState = (getDataSource, setDataSource, initialValue, deps = []) => {
    const [data, setData] = useState(initialValue);
    const [isLoading, setIsLoading] = useState(initialValue);

    const getDataFromSource = async () => {
        const data = await getDataSource();

        setData(data);
    }

    const setDataToSource = async (data) => {
        await setDataSource(data);
        await getDataFromSource();
    }

    const updateData = (data) => {
        setIsLoading(true)
        setData(data);
        setDataToSource(data)
            .then(() => setIsLoading(false))
            .catch(() => setIsLoading(false));
    }

    useEffect(() => {
        getDataFromSource();
    }, deps);

    return [data, updateData, isLoading]
}
