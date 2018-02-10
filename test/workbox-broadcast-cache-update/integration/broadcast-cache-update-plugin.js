const expect = require('chai').expect;

const activateSW = require('../../../infra/testing/activate-sw');

describe(`broadcastCacheUpdate.Plugin`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-broadcast-cache-update/static/`;
  const swUrl = `${testingUrl}sw.js`;
  const apiUrl = `${testServerAddress}/test/uniqueETag`;

  it(`should broadcast a message on the expected channel when there's a cache update`, async function() {
    await global.__workbox.webdriver.get(testingUrl);
    await activateSW(swUrl);

    const supported = await global.__workbox.webdriver.executeScript(() => {
      return 'BroadcastChannel' in window;
    });

    if (!supported) {
      this.skip();
      return;
    }

    const err = await global.__workbox.webdriver.executeAsyncScript((apiUrl, cb) => {
      // There's already a cached entry for apiUrl created by the
      // service worker's install handler.
      fetch(apiUrl)
        .then(() => cb())
        .catch((err) => cb(err.message));
    }, apiUrl);

    expect(err).to.not.exist;

    await global.__workbox.webdriver.wait(() => {
      return global.__workbox.webdriver.executeScript(() => {
        return typeof window.__test.message !== 'undefined';
      });
    });

    const updateMessageEventData = await global.__workbox.webdriver.executeScript(() => {
      return window.__test.message;
    });

    expect(updateMessageEventData).to.deep.equal({
      meta: 'workbox-broadcast-cache-update',
      payload: {
        cacheName: 'bcu-integration-test',
        updatedUrl: apiUrl,
      },
      type: 'CACHE_UPDATED',
    });
  });
});
