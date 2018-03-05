const activateSWSafari = require('./activate-sw-safari');

module.exports = async (swUrl) => {
  if (global.__workbox.seleniumBrowser.getId() === 'safari') {
    return activateSWSafari(swUrl);
  }

  const error = await global.__workbox.webdriver.executeAsyncScript((swUrl, cb) => {
    function _onStateChangePromise(registration, desiredState) {
      return new Promise((resolve, reject) => {
        if (registration.installing === null) {
          throw new Error('Service worker is not installing.');
        }

        let serviceWorker = registration.installing;

        // We unregister all service workers after each test - this should
        // always trigger an install state change
        let stateChangeListener = function(evt) {
          if (evt.target.state === desiredState) {
            serviceWorker.removeEventListener('statechange', stateChangeListener);
            resolve();
            return;
          }

          if (evt.target.state === 'redundant') {
            serviceWorker.removeEventListener('statechange', stateChangeListener);

            // Must call reject rather than throw error here due to this
            // being inside the scope of the callback function stateChangeListener
            reject(new Error('Installing servier worker became redundant'));
            return;
          }
        };

        serviceWorker.addEventListener('statechange', stateChangeListener);
      });
    }

    navigator.serviceWorker.register(swUrl)
    .then((registration) => {
      return _onStateChangePromise(registration, 'activated');
    })
    .then(() => {
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
    })
    .then(() => cb())
    .catch((err) => cb(err));
  }, swUrl);

  if (error) {
    throw error;
  }
};
