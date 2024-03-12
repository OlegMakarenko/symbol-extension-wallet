window.onload = () => {
    Array.prototype.slice.call(document.getElementsByTagName('button')).map(el => el.addEventListener('click', () => {
        chrome.runtime.sendMessage({});
    }));
}
