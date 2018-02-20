const activateSWSafari = require('./activate-sw-safari');

module.exports = async (swUrl) => {
  if (global.__workbox.seleniumBrowser.getId() === 'safari') {
    return activateSWSafari(swUrl);
  }

  const error = await global.__workbox.webdriver.executeAsyncScript((swUrl, cb) => {
    if (navigator.serviceWorker.controller &&
        navigator.serviceWorker.controller.scriptURL === swUrl) {
      cb();
    } else {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (navigator.serviceWorker.controller.scriptURL === swUrl) {
          cb();
        }
      });
      navigator.serviceWorker.register(swUrl).catch((error) => cb(error));
    }
  }, swUrl);

  if (error) {
    throw error;
  }
};
