const expect = require('chai').expect;

const activateSW = require('../../../infra/testing/activate-sw');

describe.only(`[workbox-strategies] NetworkOnly Requests`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-strategies/static/network-only/`;
  const swUrl = `${testingUrl}sw.js`;

  it(`should respond with a non-cached entry`, async function() {
    const cacheName = 'network-only';

    // Load the page and wait for the first service worker to register and activate.
    await global.__workbox.webdriver.get(testingUrl);
    await activateSW(global.__workbox.webdriver, swUrl);

    let response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(new URL(`/test/uniqueValue`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    });
    const firstResponse = response.trim();
    expect(firstResponse).to.not.equal('Cached');

    await global.__workbox.webdriver.executeAsyncScript((cacheName, cb) => {
      caches.delete(cacheName)
      .then(cb)
      .catch(cb);
    }, cacheName);

    response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(new URL(`/test/uniqueValue`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    });
    const secondResponse = response.trim();
    expect(secondResponse).to.not.equal(firstResponse);

    const cachedValues = await global.__workbox.webdriver.executeAsyncScript((cacheName, cb) => {
      caches.open(cacheName)
        .then((cache) => cache.keys())
        .then(cb)
        .catch(cb);
    }, cacheName);
    expect(cachedValues.length).to.equal(0);
  });
});
