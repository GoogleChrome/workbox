module.exports = async (swUrl) => {
  // First step: Wait for the page to activate
  let error = await global.__workbox.webdriver.executeAsyncScript((swUrl, cb) => {
    const onStateChangePromise = (registration, desiredState) => {
      return new Promise((resolve, reject) => {
        if (desiredState === 'activated' &&
            registration.active &&
            // Checking that the URLs match is needed to fix:
            // https://github.com/GoogleChrome/workbox/issues/1633
            registration.active.scriptURL === swUrl) {
          resolve();
          return;
        }

        const serviceWorker = registration.installing || registration.waiting;
        if (serviceWorker === null) {
          throw new Error('There is no installing or waiting service worker.');
        }

        const stateChangeListener = function(evt) {
          if (evt.target.state === desiredState) {
            serviceWorker.removeEventListener('statechange', stateChangeListener);
            resolve();
            return;
          }

          if (evt.target.state === 'redundant') {
            serviceWorker.removeEventListener('statechange', stateChangeListener);

            // Must call reject rather than throw error here due to this
            // being inside the scope of the callback function stateChangeListener
            reject(new Error('The new service worker became redundant.'));
            return;
          }
        };

        serviceWorker.addEventListener('statechange', stateChangeListener);
      });
    };

    navigator.serviceWorker.register(swUrl)
      .then((registration) => onStateChangePromise(registration, 'activated'))
      .then(() => cb())
      .catch((err) => cb(err.message));
  }, swUrl);

  if (error) {
    throw error;
  }

  // To be 100% certain - ensure the SW is controlling the page.
  error = await global.__workbox.webdriver.executeAsyncScript((swUrl, cb) => {
    if (navigator.serviceWorker.controller &&
        navigator.serviceWorker.controller.scriptURL === swUrl) {
      cb();
    } else if (!navigator.serviceWorker.controller) {
      cb(`There's no service worker controlling the page.`);
    } else {
      cb(`There's an unexpected SW controlling the page: ${navigator.serviceWorker.controller.scriptURL}`);
    }
  }, swUrl);

  if (error) {
    throw error;
  }
};
