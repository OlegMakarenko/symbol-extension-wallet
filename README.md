# Symbol Extension Wallet

The Symbol Wallet browser extension project. Built with Next.js, Tailwind.css and Symbol-SDK v3. Allows to sign and announce transactions using the browser popup.

Structure:
- `manifest.json` - extension configuration.
- `content-script.js` - provides an API to communicate with the wallet from the webpage.
- `background-script.js` - handles an API. Run in background.
- `/pages/_app.jsx` - the popup entry point.

## Requirements

Node.js v20

## Installation

```
npm install
```

## Build

### Google Chrome

1. Run:
```
npm run build:chrome
```
2. Import dir `/out/chrome/build` with the Chrome Extension Manager.
