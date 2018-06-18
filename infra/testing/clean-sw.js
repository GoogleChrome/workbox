const runInSW = require('./comlink/node-interface');

module.exports = async (webdriver, testingUrl) => {
  await webdriver.get(testingUrl);
  try {
    await runInSW('clearAllCaches');
  } catch (ignored) {
    // There might not yet be a service worker registered, in which case we
    // can't call runInSW().
  }
  const error = await webdriver.executeAsyncScript((cb) => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        return reg.unregister();
      }
    }).then(() => cb()).catch((err) => cb(err.message));
  });
  if (error) {
    throw new Error(error);
  }
  await webdriver.get(testingUrl);
};
