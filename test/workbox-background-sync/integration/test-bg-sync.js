const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const waitUntil = require('../../../infra/testing/wait-until');

describe(`[workbox-background-sync] Load and use Background Sync`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-background-sync/static/basic-example/`;
  const swUrl = `${testingUrl}sw.js`;

  let requestCounter;
  beforeEach(function() {
    requestCounter = global.__workbox.server.startCountingRequests();
  });
  afterEach(function() {
    global.__workbox.server.stopCountingRequests(requestCounter);
  });

  it(`should load a page with service worker`, async function() {
    // Load the page and wait for the first service worker to register and activate.
    await global.__workbox.webdriver.get(testingUrl);
    await activateAndControlSW(swUrl);

    const url = `/test/workbox-background-sync/static/basic-example/example.txt`;
    const err = await global.__workbox.webdriver.executeAsyncScript((url, cb) => {
      return fetch(url).then(() => cb()).catch((err) => cb(err.message));
    }, url);

    expect(err).to.not.exist;

    await waitUntil(() => {
      const count = requestCounter.getUrlCount(url);
      return count > 0;
    }, 20, 500);
  });
});
