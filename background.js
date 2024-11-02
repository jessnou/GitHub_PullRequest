import configuration from './configuration.js';

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        console.log(`background: chrome['runtime'].onMessage.addListener:`, request, sender, sendResponse);

        if (request.type === 'background:conf') {
            sendResponse(configuration);
        }
        else if (request.type === 'background:auth') {
            chrome.storage.local.set({token: request.data.token}, () => sendResponse({}));
        }
        else if (request.type === 'background:token') {
            chrome.storage.local.get(['token'], storage => sendResponse({token: storage?.token}));
        }
        else if (request.type === 'background:authorized') {
            chrome.storage.local.get(
                ['token'], storage => {
                    let _t = typeof storage.token !== 'undefined' ? storage.token : '';

                    let _body = new FormData();
                        _body.append('token', _t);

                    let _init = {};
                        _init['body'] = _body;
                        _init['method'] = 'POST';

                    fetch(configuration.API.URL_CALLBACK('v7_0/api/github-token-verification'), _init)
                        .then(response => response.json())
                        .then(response => sendResponse({token: _t, authorized: response?.status === 200}))
                        .catch(error => sendResponse({token: undefined, authorized: false}));
                }
            );
        }
        return true;
    }
);
