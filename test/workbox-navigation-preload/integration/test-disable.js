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

describe(`navigationPreload.disable`, function () {
  const staticPath = `/test/workbox-navigation-preload/static/`;
  const baseURL = global.__workbox.server.getAddress() + staticPath;
  const integrationURL = `${baseURL}integration.html`;
  const integrationURLPath = `${staticPath}integration.html`;

  let requestCounter;
  beforeEach(async function () {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, integrationURL);
    requestCounter = global.__workbox.server.startCountingRequests(
      'Service-Worker-Navigation-Preload',
    );
  });
  afterEach(function () {
    global.__workbox.server.stopCountingRequests(requestCounter);
  });

  it(`should support disabling previously enabled navigation preload`, async function () {
    await activateAndControlSW(`${baseURL}sw-default-header.js`);

    const isEnabled = await runInSW('isNavigationPreloadSupported');

    if (!isEnabled) {
      // Just bail early if navigation preload isn't supported, since testing
      // the disable flow isn't meaningful.
      return this.skip();
    }

    expect(requestCounter.getURLCount(integrationURLPath)).to.eql(0);

    await global.__workbox.webdriver.get(integrationURL);

    expect(requestCounter.getURLCount(integrationURLPath)).to.eql(1);

    // Active the new service worker that has navigation preload disabled.
    await activateAndControlSW(`${baseURL}sw-disable.js`);

    await global.__workbox.webdriver.get(integrationURL);

    // With navigation preload now disabled, the synthetic response from the
    // service worker should fulfill the navigation request, and the server
    // won't get another HTTP request.
    expect(requestCounter.getURLCount(integrationURLPath)).to.eql(1);
  });
});
