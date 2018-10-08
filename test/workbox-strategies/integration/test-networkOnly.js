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

describe(`[workbox-strategies] NetworkOnly Requests`, function() {
  const baseUrl = `${global.__workbox.server.getAddress()}/test/workbox-strategies/static/network-only/`;

  beforeEach(async function() {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, `${baseUrl}integration.html`);
  });

  it(`should respond with a non-cached entry`, async function() {
    const swUrl = `${baseUrl}sw.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swUrl);

    let response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(`/__WORKBOX/uniqueValue`)
          .then((response) => response.text())
          .then((responseBody) => cb(responseBody))
          .catch((err) => cb(err.message));
    });
    const firstResponse = response.trim();
    expect(firstResponse).to.not.eql('Cached');

    await runInSW('clearAllCaches');

    response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(`/__WORKBOX/uniqueValue`)
          .then((response) => response.text())
          .then((responseBody) => cb(responseBody))
          .catch((err) => cb(err.message));
    });
    const secondResponse = response.trim();
    expect(secondResponse).to.not.eql(firstResponse);

    const keys = await runInSW('cachesKeys');
    expect(keys).to.eql([]);
  });
});
