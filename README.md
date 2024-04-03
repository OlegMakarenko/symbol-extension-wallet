# Symbol Extension Wallet

The Symbol Wallet browser extension. View, sign and announce transactions using the browser popup. Supports all transaction types. Built with Next.js, Tailwind.css and Symbol SDK v3. Depends on Metamask's [Browser Passworder](https://www.npmjs.com/package/@metamask/browser-passworder) encryption module.

## Requirements

Node.js v20

## Installation

```
npm install
```

## Build

### Development

1. Run:
```
npm run dev
```
2. Visit `http://localhost:3000/`.

### Google Chrome

1. Run:
```
npm run build:chrome
```
2. Import dir `/out/chrome/build` with the Chrome Extension Manager.


## Folder structure
  - `public`: Asset folder to store all images, fonts, etc.
    - `manifest.json` - extension configuration.
    - `content-script.js` - provides an API to communicate with the wallet from the webpage.
    - `background-script.js` - handles an API. Run in background.
  - `components`: Folder to store any common component that is used through the app.
  - `config`:
    - `config.json`: Main configuration file of the app. Contains all endpoints.
    - `constants.js`: Stores any kind of constant.
    - `knownAccounts.json`: Contains the list of known accounts (exchanges, orgs, etc.).
    - `optInWhiteList.json`: Contains the list of public keys generated with the Symbol Pre-launch Opt-in Mobile Wallet.
    - `termsAndPrivacy.json`: Contains the Terms and Conditions and Privacy Policy text.
  - `localization`: Contains localization module.
    - `locales`: Folder to store the languages files.
  - `screens`: Folder that contains all your application screens/features.
  - `services`: Folder that contains modules which communicate with an API.
  - `storage`: Folder that contains the storage interface (the app cache interface).
  - `store`: Folder that contains redux store and logic (in-memory store).
  - `styles`: Folder to store all the styling concerns related to the application theme.
  - `utils`: Folder to store all the helper functions and hooks.
  - `/pages/_app.jsx` - the popup entry point.
