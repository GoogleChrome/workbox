const activateSWSafari = require('./activate-sw-safari');

module.exports = async (swUrl) => {
  if (global.__workbox.seleniumBrowser.getId() === 'safari') {
    return activateSWSafari(swUrl);
  }

  const error = await global.__workbox.webdriver.executeAsyncScript((swUrl, cb) => {
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

        let serviceWorker = registration.installing;

        // We unregister all service workers after each test - this should
        // always trigger an install state change
        const stateChangeListener = (event) => {
          if (event.target.state === desiredState) {
            serviceWorker.removeEventListener('statechange', stateChangeListener);
            resolve();
            return;
          }

          if (event.target.state === 'redundant') {
            serviceWorker.removeEventListener('statechange', stateChangeListener);
            reject(new Error('Installing service worker became redundant.'));
            return;
          }
        };

        serviceWorker.addEventListener('statechange', stateChangeListener);
      });
    }

    navigator.serviceWorker.register(swUrl).then((registration) => {
      return _onStateChangePromise(registration, 'activated');
    }).then(() => {
      // Ensure the page is being controlled by the SW.
      if (navigator.serviceWorker.controller &&
          navigator.serviceWorker.controller.scriptURL === swUrl) {
        return;
      } else {
        return new Promise((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (navigator.serviceWorker.controller.scriptURL === swUrl) {
              resolve();
            }
          });
        });
      }
    }).then(() => cb()).catch((error) => cb(error.message));
  }, swUrl);

  if (error) {
    throw new Error(error);
  }
};
