const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const cleanSWEnv = require('../../../infra/testing/clean-sw');
const runInSW = require('../../../infra/testing/comlink/node-interface');
const waitUntil = require('../../../infra/testing/wait-until');

describe(`[workbox-strategies] NetworkFirst Requests`, function() {
  const baseUrl = `${global.__workbox.server.getAddress()}/test/workbox-strategies/static/network-first/`;

  beforeEach(async function() {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, `${baseUrl}integration.html`);
  });

  it(`should respond with a non-cached entry but stash request in a cache`, async function() {
    const swUrl = `${baseUrl}sw.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swUrl);

    const cacheName = 'network-first';

    let response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(`/__WORKBOX/uniqueValue`)
        .then((response) => response.text())
        .then((responseBody) => cb(responseBody))
        .catch((err) => cb(err.message));
    });
    const firstResponse = response.trim();
    expect(firstResponse).to.not.equal('Cached');

    // Writing to the cache is asynchronous, so this might not happen right away.
    await waitUntil(async () => {
      const responseText = await runInSW('getCachedResponseText', cacheName, '/__WORKBOX/uniqueValue');
      return responseText === firstResponse;
    });

    response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(`/__WORKBOX/uniqueValue`)
        .then((response) => response.text())
        .then((responseBody) => cb(responseBody))
        .catch((err) => cb(err.message));
    });
    const secondResponse = response.trim();
    expect(secondResponse).to.not.equal(firstResponse);

    // Writing to the cache is asynchronous, so this might not happen right away.
    await waitUntil(async () => {
      const responseText = await runInSW('getCachedResponseText', cacheName, '/__WORKBOX/uniqueValue');
      return responseText === secondResponse;
    });
  });
});
