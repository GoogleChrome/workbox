const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const cleanSWEnv = require('../../../infra/testing/clean-sw');

describe(`[workbox-strategies] CacheFirst Requests`, function() {
  const baseUrl = `${global.__workbox.server.getAddress()}/test/workbox-strategies/static/cache-first/`;

  beforeEach(async function() {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, `${baseUrl}integration.html`);
  });

  it(`should respond with a cached response`, async function() {
    const swUrl = `${baseUrl}sw.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swUrl);

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
