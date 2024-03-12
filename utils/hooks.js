import { Passcode } from '@/components/Passcode';
import { useEffect, useState } from 'react';
import { showMessage } from './helper';

export const usePasscode = (onSubmit, onCancel, cancellable = true) => {
    const [isVisible, setIsVisible] = useState(false);

    const showPasscode = () => setIsVisible(true);
    const handleCancel = () => {
        if (cancellable) {
            setIsVisible(false);
            onCancel && onCancel()
        }
    };
    const handleSubmit = async (password) => {
        try {
            await onSubmit(password);
            setIsVisible(false);
        }
        catch(e) {
            console.error(e);
            showMessage({type: 'danger', message: e.message})
        }
    }
    const Component = () => isVisible && <Passcode onSubmit={handleSubmit} onCancel={handleCancel} />

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
