import { EXTENSION_MESSAGES } from '@/constants';
import PortStream from 'extension-port-stream'
import browser from 'webextension-polyfill';
import { ExtensionController } from './ExtensionController';
import { WalletController } from './WalletController';

let controller;

const registerInPageContentScript = async () => {
    try {
        await chrome.scripting.registerContentScripts([
            {
                id: 'inpage',
                matches: ['file://*/*', 'http://*/*', 'https://*/*'],
                js: ['inpage.js'],
                runAt: 'document_start',
                world: 'MAIN',
            },
        ]);
    } catch (err) {
        console.warn(`Dropped attempt to register inpage content script. ${err}`);
    }
};

const sendReadyMessageToTabs = async () => {
    const tabs = await browser.tabs.query({
        url: '<all_urls>',
        windowType: 'normal',
    });

    await Promise.allSettled(tabs.map(tab =>
        browser.tabs.sendMessage(tab.id, {
            name: EXTENSION_MESSAGES.READY,
        })
    ));
};

const connectRemote = (remotePort) => {
    const portStream = new PortStream(remotePort)
    controller.setupCommunication(portStream, remotePort.sender);
}

const initialize = () => {
    controller = new ExtensionController({ browser });
    setInterval(async () => {
        const requests = await WalletController.getRequests();
        controller.updateBadge(requests.length);
        WalletController.removeExpiredRequests();
    }, 1000);

    browser.runtime.onConnect.addListener(connectRemote);
}

const initBackgroundScript = async () => {
    await registerInPageContentScript();
    initialize();
    await sendReadyMessageToTabs();
}

initBackgroundScript();
