/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const cleanSWEnv = require('../../../infra/testing/clean-sw');
const runInSW = require('../../../infra/testing/comlink/node-interface');
const waitUntil = require('../../../infra/testing/wait-until');

describe(`[workbox-strategies] StaleWhileRevalidate Requests`, function () {
  const baseURL = `${global.__workbox.server.getAddress()}/test/workbox-strategies/static/stale-while-revalidate/`;

  beforeEach(async function () {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, `${baseURL}integration.html`);
  });

  it(`should respond with cached entry and update it`, async function () {
    const swURL = `${baseURL}sw.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swURL);

    const cacheName = 'stale-while-revalidate';

    let response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(`/__WORKBOX/uniqueValue`)
        .then((response) => response.text())
        .then((responseBody) => cb(responseBody))
        .catch((err) => cb(err.message));
    });
    const firstResponse = response.trim();

    // Writing to the cache is asynchronous, so this might not happen right away.
    await waitUntil(async () => {
      const responseText = await runInSW(
        'getCachedResponseText',
        cacheName,
        '/__WORKBOX/uniqueValue',
      );
      return responseText === firstResponse;
    });

    // This response should come from cache and not the server
    response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(`/__WORKBOX/uniqueValue`)
        .then((response) => response.text())
        .then((responseBody) => cb(responseBody))
        .catch((err) => cb(err.message));
    });
    const secondResponse = response.trim();
    expect(secondResponse).to.eql(firstResponse);

    // Writing to the cache is asynchronous, so this might not happen right away.
    // We expect a new value, updated from the network, different than secondResponse.
    await waitUntil(async () => {
      const responseText = await runInSW(
        'getCachedResponseText',
        cacheName,
        '/__WORKBOX/uniqueValue',
      );
      return responseText !== secondResponse;
    });
  });
});
