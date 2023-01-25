/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const cleanSWEnv = require('../../../infra/testing/clean-sw');

describe(`[workbox-strategies] CacheOnly`, function () {
  const baseURL = `${global.__workbox.server.getAddress()}/test/workbox-strategies/static/cache-only/`;

  beforeEach(async function () {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, `${baseURL}integration.html`);
  });

  it(`should respond with a cached response`, async function () {
    const swURL = `${baseURL}sw.js`;

    // Wait for the service worker to register and activate.
    await activateAndControlSW(swURL);

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
