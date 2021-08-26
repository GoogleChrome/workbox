/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const activateSWSafari = require('./activate-sw-safari');

// TODO(philipwalton): remove this in favor of using workbox-window.
module.exports = async (swURL) => {
  if (global.__workbox.seleniumBrowser.getId() === 'safari') {
    return activateSWSafari(swURL);
  }

  const error = await global.__workbox.webdriver.executeAsyncScript(
    (swURL, cb) => {
      function _onStateChangePromise(registration, desiredState) {
        return new Promise((resolve, reject) => {
          if (desiredState === 'activated' && registration.active) {
            resolve();
            return;
          }

          if (registration.installing === null) {
            reject(new Error('No installing service worker found.'));
            return;
          }

          const serviceWorker = registration.installing;

          // We unregister all service workers after each test - this should
          // always trigger an install state change
          const stateChangeListener = (event) => {
            if (event.target.state === desiredState) {
              serviceWorker.removeEventListener(
                'statechange',
                stateChangeListener,
              );
              resolve();
              return;
            }

            if (event.target.state === 'redundant') {
              serviceWorker.removeEventListener(
                'statechange',
                stateChangeListener,
              );
              reject(new Error('Installing service worker became redundant.'));
              return;
            }
          };

          serviceWorker.addEventListener('statechange', stateChangeListener);
        });
      }

      navigator.serviceWorker
        .register(swURL)
        .then((registration) => {
          return _onStateChangePromise(registration, 'activated');
        })
        .then(() => {
          // Ensure the page is being controlled by the SW.
          if (
            navigator.serviceWorker.controller &&
            navigator.serviceWorker.controller.scriptURL === swURL
          ) {
            return;
          } else {
            return new Promise((resolve) => {
              navigator.serviceWorker.addEventListener(
                'controllerchange',
                () => {
                  if (navigator.serviceWorker.controller.scriptURL === swURL) {
                    resolve();
                  }
                },
              );
            });
          }
        })
        .then(() => cb())
        .catch((error) => cb(error.message));
    },
    swURL,
  );

  if (error) {
    throw new Error(error);
  }
};
