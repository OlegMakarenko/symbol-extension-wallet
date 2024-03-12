
import 'react-toastify/dist/ReactToastify.css';
import '@/styles/tailwind.css';
import '@/styles/fonts.css';
// import '@/styles/global.scss';
import { useEffect, useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { initLocalization } from '@/localization';
import { ExtensionMessaging } from '@/components/ExtensionMessaging';

export default function App({ Component, pageProps }) {
    const [isClient, setIsClient] = useState(false);
    const [isReady, setReady] = useState(false);

    useEffect(() => {
        setIsClient(true);
        (async () => {
            await initLocalization();
            setReady(true);
        })();
    }, []);

    return isClient ? (
        <MemoryRouter>
            <ExtensionMessaging />
            <Component isReady={isReady} {...pageProps} />
        </MemoryRouter>
    ) : null;
}
