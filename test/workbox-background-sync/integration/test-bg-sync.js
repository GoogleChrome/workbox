const expect = require('chai').expect;

const activateSW = require('../../../infra/testing/activate-sw');

describe(`[workbox-background-sync] Load and use Background Sync`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-background-sync/static/basic-example/`;
  const swUrl = `${testingUrl}sw.js`;

  const waitUntilRequestMade = (url, maxRetires, intervalInMs) => {
    let tries = 0;
    return new Promise((resolve, reject) => {
      const intervalId = setInterval(() => {
        tries++;
        const requests = global.__workbox.server.getRequests();
        if (requests[url] > 0) {
          clearInterval(intervalId);
          resolve();
        } else if (tries > maxRetires) {
          clearInterval(intervalId);
          reject(`Request not made: ${url}`);
        }
      }, intervalInMs);
    });
  };

  it(`should load a page with service worker`, async function() {
    // Load the page and wait for the first service worker to register and activate.
    await global.__workbox.webdriver.get(testingUrl);
    await activateSW(swUrl);

    const err = await global.__workbox.webdriver.executeAsyncScript((testingUrl, cb) => {
      return fetch(`${testingUrl}example.txt`)
      .then(() => cb(), (err) => cb(err.message));
    }, testingUrl);

    expect(err).to.not.exist;

    await waitUntilRequestMade(`/test/workbox-background-sync/static/basic-example/example.txt`, 20, 500);
  });
});
