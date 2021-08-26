/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const qs = require('qs');

const {runUnitTests} = require('../../../infra/testing/webdriver/runUnitTests');
const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const waitUntil = require('../../../infra/testing/wait-until');

// Store local references of these globals.
const {webdriver, server} = global.__workbox;

describe(`[workbox-google-analytics]`, function () {
  it(`passes all SW unit tests`, async function () {
    await runUnitTests('/test/workbox-google-analytics/sw/');
  });
});

describe(`[workbox-google-analytics] initialize`, function () {
  const testServerAddress = server.getAddress();
  const testingURL = `${testServerAddress}/test/workbox-google-analytics/static/basic-example/`;
  const swURL = `${testingURL}sw.js`;

  /**
   * Sends a mesage to the service worker via postMessage and invokes the
   * `done()` callback when the service worker responds, with any data value
   * passed to the event.
   *
   * @param {Object} data An object to send to the service worker.
   * @param {Function} done The callback automatically passed via webdriver's
   *     `executeAsyncScript()` method.
   */
  const messageSW = (data, done) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (evt) => done(evt.data);
    navigator.serviceWorker.controller.postMessage(data, [
      messageChannel.port2,
    ]);
  };

  before(async function () {
    // Load the page and wait for the first service worker to activate.
    await webdriver.get(testingURL);

    await activateAndControlSW(swURL);
  });

  beforeEach(async function () {
    // Reset the spied requests array.
    await webdriver.executeAsyncScript(messageSW, {
      action: 'clear-spied-requests',
    });
  });

  it(`should load a page with service worker`, async function () {
    const err = await webdriver.executeAsyncScript((done) => {
      fetch('https://www.google-analytics.com/analytics.js', {
        mode: 'no-cors',
      }).then(
        () => done(),
        (err) => done(err.message),
      );
    });

    expect(err).to.not.exist;
  });

  it(`replay failed Google Analytics hits`, async function () {
    // Skip this test in browsers that don't support background sync.
    // TODO(philipwalton): figure out a way to work around this.
    const browserSupportsSync = await webdriver.executeScript(() => {
      return 'SyncManager' in window;
    });
    if (!browserSupportsSync) this.skip();

    // Send a hit while online to ensure regular requests work.
    await webdriver.executeAsyncScript((done) => {
      window.gtag('event', 'beacon', {
        transport_type: 'beacon',
        event_callback: () => done(),
      });
    });

    let requests = await webdriver.executeAsyncScript(messageSW, {
      action: 'get-spied-requests',
    });
    expect(requests).to.have.lengthOf(1);

    // Reset the spied requests array.
    await webdriver.executeAsyncScript(messageSW, {
      action: 'clear-spied-requests',
    });

    // Switch the service worker into "offline" mode.
    await webdriver.executeAsyncScript(messageSW, {
      action: 'simulate-offline',
      value: true,
    });

    await webdriver.executeAsyncScript((done) => {
      window.gtag('event', 'beacon', {
        transport_type: 'beacon',
        event_label: Date.now(),
        event_callback: () => {
          // See https://github.com/GoogleChrome/workbox/issues/2168
          setTimeout(done, 50);
        },
      });
    });

    await webdriver.executeAsyncScript((done) => {
      window.gtag('event', 'pixel', {
        transport_type: 'image',
        event_label: Date.now(),
        event_callback: () => {
          // See https://github.com/GoogleChrome/workbox/issues/2168
          setTimeout(done, 50);
        },
      });
    });

    // This request should not match GA routes, so it shouldn't be replayed.
    await webdriver.executeAsyncScript((done) => {
      fetch('https://httpbin.org/get').then(() => done());
    });

    // Get all spied requests and ensure there haven't been any (since we're
    // offline).
    requests = await webdriver.executeAsyncScript(messageSW, {
      action: 'get-spied-requests',
    });
    expect(requests).to.have.lengthOf(0);

    // Switch the service worker into "online" mode.
    await webdriver.executeAsyncScript(messageSW, {
      action: 'simulate-offline',
      value: false,
    });

    // Dispatch a sync event.
    await webdriver.executeAsyncScript(messageSW, {
      action: 'dispatch-sync-event',
    });

    // Wait until all expected requests have replayed.
    await waitUntil(
      async () => {
        requests = await webdriver.executeAsyncScript(messageSW, {
          action: 'get-spied-requests',
        });
        return requests.length === 2;
      },
      25,
      200,
    );

    // Parse the request bodies to set the params as an object and convert the
    // qt param to a number.
    for (const request of requests) {
      request.params = qs.parse(request.body);
      request.params.qt = Number(request.params.qt);
      request.originalTime = request.timestamp - request.params.qt;
    }

    expect(requests[0].params.ea).to.equal('beacon');
    expect(requests[1].params.ea).to.equal('pixel');

    // Ensure the hit's qt params were present and greater than 0,
    // and ensure those values reflect the original order of the hits.
    expect(requests[0].params.qt > 0).to.be.true;
    expect(requests[1].params.qt > 0).to.be.true;
    expect(requests[0].originalTime < requests[1].originalTime).to.be.true;
  });
});
