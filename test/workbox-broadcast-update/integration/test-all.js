/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const {runUnitTests} = require('../../../infra/testing/webdriver/runUnitTests');


// Store local references of these globals.
const {webdriver, server} = global.__workbox;

describe(`[workbox-broadcast-update]`, function() {
  it(`passes all SW unit tests`, async function() {
    await runUnitTests('/test/workbox-broadcast-update/sw/');
  });
});

describe(`[workbox-broadcast-update] Plugin`, function() {
  const testServerAddress = server.getAddress();
  const testingURL = `${testServerAddress}/test/workbox-broadcast-update/static/`;
  const swURL = `${testingURL}sw.js`;
  const apiURL = `${testServerAddress}/__WORKBOX/uniqueETag`;

  it(`should broadcast a message on the expected channel when there's a cache update`, async function() {
    await webdriver.get(testingURL);
    await activateAndControlSW(swURL);

    const err = await webdriver.executeAsyncScript((apiURL, cb) => {
      navigator.serviceWorker.addEventListener('message', (event) => {
        window.__test.message = event.data;
      });

      // There's already a cached entry for apiURL created by the
      // service worker's install handler.
      fetch(apiURL)
          .then(() => cb())
          .catch((err) => cb(err.message));
    }, apiURL);

    expect(err).to.not.exist;

    await webdriver.wait(() => {
      return webdriver.executeScript(() => {
        return typeof window.__test.message !== 'undefined';
      });
    });

    const updateMessageEventData = await webdriver.executeScript(() => {
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
