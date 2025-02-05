import { ExtensionMessages } from '@/constants';
import PortStream from 'extension-port-stream'
import browser from 'webextension-polyfill';
import { ExtensionController } from './ExtensionController';
import { ExtensionWalletController } from './ExtensionWalletController';

let controller;


const sendReadyMessageToTabs = async () => {
    const tabs = await browser.tabs.query({
        url: '<all_urls>',
        windowType: 'normal',
    });

    await Promise.allSettled(tabs.map(tab =>
        browser.tabs.sendMessage(tab.id, {
            name: ExtensionMessages.READY,
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
        const requests = await ExtensionWalletController.getActionRequests();
        controller.updateBadge(requests.length);
        ExtensionWalletController.removeExpiredActionRequests();
    }, 1000);

    browser.runtime.onConnect.addListener(connectRemote);
}

const initBackgroundScript = async () => {
    initialize();
    await sendReadyMessageToTabs();
}

initBackgroundScript();
