const expect = require('chai').expect;

const activateSW = require('../../../infra/testing/activate-sw');

describe(`[workbox-strategies] CacheFirst Requests`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-strategies/static/cache-first/`;
  const swUrl = `${testingUrl}sw.js`;

  it(`should respond with cached and non-cached entry`, async function() {
    // Load the page and wait for the first service worker to register and activate.
    await global.__workbox.webdriver.get(testingUrl);
    await activateSW(swUrl);

    let response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(new URL(`/test/workbox-strategies/static/cache-first/example.txt`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    });
    expect(response.trim()).to.equal('hello');

    let requestsMade = global.__workbox.server.getRequests();
    expect(requestsMade['/test/workbox-strategies/static/cache-first/example.txt']).to.equal(1);

    // This request should come from cache and not the server
    response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(new URL(`/test/workbox-strategies/static/cache-first/example.txt`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    });
    expect(response.trim()).to.equal('hello');

    requestsMade = global.__workbox.server.getRequests();
    expect(requestsMade['/test/workbox-strategies/static/cache-first/example.txt']).to.equal(1);
  });
});
