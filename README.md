# TOTP Viewer

A minimalist Firefox extension that generates TOTP (Time-based One-Time Password) codes directly in the browser.

## Features

- **Zero external dependencies** - uses native Web Crypto API
- **Minimalist design** - clean and compact interface
- **Copy on click** - click on the code to copy automatically
- **Visual countdown** - progress bar showing remaining time
- **Local storage** - securely saves the TOTP URL in the browser
- **Lightweight and fast** - less than 5KB total

## Installation

### Development (Temporary)

1. Clone or download this repository
2. Open Firefox and go to `about:debugging`
3. Click on "This Firefox"
4. Click on "Load Temporary Add-on"
5. Select the `manifest.json` file

### Permanent Installation

Perform a quick installation on Firefox: https://addons.mozilla.org/en-US/firefox/addon/totp-viewer/

## Usage

1. Click on the extension icon in the toolbar
2. Paste your URL TOTP in the following format:

```js
otpauth://totp/Issuer:user@example.com?secret=YOURSECRET&issuer=Issuer
```

3. Click "Save"
4. The TOTP code will be displayed and updated automatically every 30 seconds
5. Click the code to copy it to the clipboard
6. To remove, click "Delete" and confirm

## Project Structure

```js
totp-viewer/
├── manifest.json # Extension configuration
├── popup.html # Popup interface
├── popup.js # TOTP logic and interactions
├── icons/ # Extension icons
└── README.md # This file

```

## Security

- **Local storage only** - secrets are not synchronized between devices
- **No external connections** - all processing is done locally
- **Web Crypto API** - uses native browser cryptographic algorithms
- **No analytics or tracking** - zero data collection

⚠️ **Warning:** This extension stores TOTP secrets locally in the browser. Ensure your device is password/encrypted.

## Technologies

- **Manifest V3** - latest version of the extension standard
- **Web Crypto API** - native HMAC-SHA1
- **Browser Storage API** - persistent local storage
- **Clipboard API** - automatic copy to clipboard

## TOTP Algorithm

Implements the [RFC 6238](https://tools.ietf.org/html/rfc6238) standard:

- Period: 30 seconds
- Digits: 6
- Algorithm: HMAC-SHA1
- Encoding: Base32

## Permissions

- `storage` - save TOTP URL locally
- `clipboardWrite` - copy code to clipboard

## Development

### Requirements

- Firefox 109+
- Code editor

### Code Structure

**popup.js** contains:

- `base32Decode()` - decodes secret in Base32
- `generateTOTP()` - generates TOTP code using Web Crypto API
- `parseOtpAuthUrl()` - parses the URL otpauth://
- Event listeners for UI and storage

### Modifications

To change the update interval (default 30s):

```js
const epoch = Math.floor(time / 30000); // Change 30000 to another value in ms
```

To change the number of digits (default 6):

```js
const otp = (binary % 1000000).toString(); // Change 1000000 to 10^n
```

## Limitations

- Supports only TOTP (not HOTP)
- One URL at a time
- Fixed period of 30 seconds
- 6 fixed digits
- Only HMAC-SHA1

## Contributing

Pull requests are welcome. For larger changes, please open an issue first to discuss what you would like to change.
