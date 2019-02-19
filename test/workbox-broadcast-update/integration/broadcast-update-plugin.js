/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');

describe(`broadcastUpdate.Plugin`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingURL = `${testServerAddress}/test/workbox-broadcast-update/static/`;
  const swURL = `${testingURL}sw.js`;
  const apiURL = `${testServerAddress}/__WORKBOX/uniqueETag`;

  it(`should broadcast a message on the expected channel when there's a cache update`, async function() {
    await global.__workbox.webdriver.get(testingURL);
    await activateAndControlSW(swURL);

    const supported = await global.__workbox.webdriver.executeScript(() => {
      return 'BroadcastChannel' in window;
    });

    if (!supported) {
      this.skip();
      return;
    }

    const err = await global.__workbox.webdriver.executeAsyncScript((apiURL, cb) => {
      // There's already a cached entry for apiURL created by the
      // service worker's install handler.
      fetch(apiURL)
          .then(() => cb())
          .catch((err) => cb(err.message));
    }, apiURL);

    expect(err).to.not.exist;

    await global.__workbox.webdriver.wait(() => {
      return global.__workbox.webdriver.executeScript(() => {
        return typeof window.__test.message !== 'undefined';
      });
    });

    const updateMessageEventData = await global.__workbox.webdriver.executeScript(() => {
      return window.__test.message;
    });

    expect(updateMessageEventData).to.deep.equal({
      meta: 'workbox-broadcast-update',
      payload: {
        cacheName: 'bcu-integration-test',
        updatedURL: apiURL,
      },
      type: 'CACHE_UPDATED',
    });
  });
});
