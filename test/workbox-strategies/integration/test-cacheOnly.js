const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const cleanSWEnv = require('../../../infra/testing/clean-sw');

describe(`[workbox-strategies] CacheOnly`, function() {
  const baseUrl = `${global.__workbox.server.getAddress()}/test/workbox-strategies/static/cache-only/`;

  beforeEach(async function() {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, `${baseUrl}integration.html`);
  });

  it(`should respond with a cached response`, async function() {
    const swUrl = `${baseUrl}sw.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swUrl);

    let response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(`/CacheOnly/InCache/`)
        .then((response) => response.text())
        .then((responseBody) => cb(responseBody))
        .catch((err) => cb(err.message));
    });
    expect(response).to.eql('Cached');

    response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(`/CacheOnly/NotInCache/`)
        .then((response) => response.text())
        .then((responseBody) => cb(responseBody))
        .catch((err) => cb(err.message));
    });
    expect(response).to.not.eql('Cached');
  });
});
