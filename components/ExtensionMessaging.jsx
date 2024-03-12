import { useEffect } from 'react';
import { useRouter } from './Router';

export const ExtensionMessaging = () => {
    const router = useRouter();
    const handleMessage = message => {
        if (message.method === 'sign-and-send') {
            router.goToTransactionRequest(message.payload);
        }
    }

    useEffect(() => {
        document.documentElement.className = 'dark';
    }, []);

    return null;
};
