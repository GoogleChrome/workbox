module.exports = async (swUrl) => {
  // First step: Wait for the page to activate
  let error = await global.__workbox.webdriver.executeAsyncScript((swUrl, cb) => {
    const onStateChangePromise = (registration, desiredState) => {
      return new Promise((resolve, reject) => {
        if (registration.installing === null) {
          throw new Error('Regstration is not installing');
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
    };

    navigator.serviceWorker.register(swUrl)
    .then((registration) => {
      return onStateChangePromise(registration, 'activated');
    })
    .then(cb)
    .catch((err) => cb(err.message));
  }, swUrl);

  if (error) {
    throw error;
  }

  // Refresh the page - Safari should be controlled by the SW after this.
  global.__workbox.webdriver.navigate().refresh();

  // To be 100% certain - ensure the SW is controlling the page.
  error = await global.__workbox.webdriver.executeAsyncScript((swUrl, cb) => {
    if (navigator.serviceWorker.controller &&
        navigator.serviceWorker.controller.scriptURL === swUrl) {
      cb();
    } else if (!navigator.serviceWorker.controller) {
      cb(`No SW controlling the page`);
    } else {
      cb(`Unexpected SW controlling the page ${navigator.serviceWorker.controller.scriptURL}`);
    }
  }, swUrl);

  if (error) {
    throw error;
  }
};
