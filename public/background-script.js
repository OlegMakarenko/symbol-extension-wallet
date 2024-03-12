const REQUEST_KEY = 'REQUEST';
const allowedMethods = ['sign-and-send'];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const isMethodAllowed = allowedMethods.some(allowedMethod => message?.method === allowedMethod);
    if (!isMethodAllowed) {
        return;
    }

    const requestDataToStore = JSON.stringify(message);

    chrome.storage.local.set({[REQUEST_KEY]: requestDataToStore});
    launchWallet();
});


const launchWallet = () => {
    chrome.windows.create({
        url: '/index.html',
        type: 'popup',
        width: 365,
        height: 630,
    });
}
