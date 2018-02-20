const activateSW = require('../../../infra/testing/activate-sw');

describe(`[workbox-core] Load core in the browser`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-core/static/core-in-browser/`;
  const swUrl = `${testingUrl}sw.js`;

  it(`should load workbox-core in a service worker.`, async function() {
    await global.__workbox.webdriver.get(testingUrl);
    await activateSW(swUrl);

    // If the service worker activated, it meant the assertions in sw.js were
    // met and workbox-core exposes the expected API and defaults that were
    // expected
  });
});
