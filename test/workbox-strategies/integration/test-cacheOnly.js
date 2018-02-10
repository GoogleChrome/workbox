const expect = require('chai').expect;

const activateSW = require('../../../infra/testing/activate-sw');

describe(`[workbox-strategies] CacheOnly Requests`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-strategies/static/cache-only/`;
  const swUrl = `${testingUrl}sw.js`;

  it(`should respond with cached and non-cached entry`, async function() {
    // Load the page and wait for the first service worker to register and activate.
    await global.__workbox.webdriver.get(testingUrl);
    await activateSW(swUrl);

    let response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(new URL(`/CacheOnly/InCache/`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    });
    expect(response).to.equal('Cached');

    // For a non-cached entry, the fetch should throw an error with
    // a message defined by the browser.
    response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(new URL(`/CacheOnly/NotInCache/`, location).href)
      .then(() => cb(null))
      .catch((err) => cb(err.message));
    });
    expect(response).to.exist;
  });
});
