/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// TODO(philipwalton): remove this in favor of using workbox-window.
module.exports = async (swURL) => {
  // First step: Wait for the page to activate
  let error = await global.__workbox.webdriver.executeAsyncScript(
    (swURL, cb) => {
      const onStateChangePromise = (registration, desiredState) => {
        return new Promise((resolve, reject) => {
          if (
            desiredState === 'activated' &&
            registration.active &&
            // Checking that the URLs match is needed to fix:
            // https://github.com/GoogleChrome/workbox/issues/1633
            registration.active.scriptURL === swURL
          ) {
            resolve();
            return;
          }

          const serviceWorker = registration.installing || registration.waiting;
          if (serviceWorker === null) {
            throw new Error(
              'There is no installing or waiting service worker.',
            );
          }

          const stateChangeListener = function (evt) {
            if (evt.target.state === desiredState) {
              serviceWorker.removeEventListener(
                'statechange',
                stateChangeListener,
              );
              resolve();
              return;
            }

            if (evt.target.state === 'redundant') {
              serviceWorker.removeEventListener(
                'statechange',
                stateChangeListener,
              );

              // Must call reject rather than throw error here due to this
              // being inside the scope of the callback function stateChangeListener
              reject(new Error('The new service worker became redundant.'));
              return;
            }
          };

          serviceWorker.addEventListener('statechange', stateChangeListener);
        });
      };

      navigator.serviceWorker
        .register(swURL)
        .then((registration) => onStateChangePromise(registration, 'activated'))
        .then(() => cb())
        .catch((err) => cb(err.message));
    },
    swURL,
  );

  if (error) {
    throw error;
  }

  // To be 100% certain - ensure the SW is controlling the page.
  error = await global.__workbox.webdriver.executeAsyncScript((swURL, cb) => {
    if (
      navigator.serviceWorker.controller &&
      navigator.serviceWorker.controller.scriptURL === swURL
    ) {
      cb();
    } else if (!navigator.serviceWorker.controller) {
      cb(`There's no service worker controlling the page.`);
    } else {
      cb(
        `There's an unexpected SW controlling the page: ${navigator.serviceWorker.controller.scriptURL}`,
      );
    }
  }, swURL);

  if (error) {
    throw error;
  }
};
