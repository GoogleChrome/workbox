/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const runInSW = require('./comlink/node-interface');

module.exports = async (webdriver, testingURL) => {
  await webdriver.get(testingURL);
  try {
    await runInSW('clearAllCaches');
  } catch (ignored) {
    // There might not yet be a service worker registered, in which case we
    // can't call runInSW().
  }
  const error = await webdriver.executeAsyncScript((cb) => {
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (reg) {
          return reg.unregister();
        }
      })
      .then(() => cb())
      .catch((err) => cb(err.message));
  });
  if (error) {
    throw new Error(error);
  }
  await webdriver.get(testingURL);
};
