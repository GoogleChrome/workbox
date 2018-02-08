module.exports = async (webdriver, swUrl) => {
  const error = await webdriver.executeAsyncScript((swUrl, cb) => {
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
