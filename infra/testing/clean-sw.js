module.exports = async (webdriver, testingUrl) => {
  await webdriver.get(testingUrl);
  await webdriver.executeAsyncScript((cb) => {
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(cb);
  });
  await webdriver.executeAsyncScript((cb) => {
    navigator.serviceWorker.getRegistration()
    .then((reg) => {
      return reg.unregister();
    })
    .then(cb)
    .catch((err) => cb(err.message));
  });
  await webdriver.get(testingUrl);
};
