const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');

describe.only(`[workbox-strategies] NetworkFirst Requests`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-strategies/static/network-first/`;
  const swUrl = `${testingUrl}sw.js`;

  const getCachedRequest = (cacheName, url) => {
    return global.__workbox.webdriver.executeAsyncScript((cacheName, url, cb) => {
      caches.open(cacheName)
      .then((cache) => {
        return cache.match(url);
      })
      .then((response) => response.text())
      .then((response) => {
        cb(response);
      })
      .catch((err) => cb());
    }, cacheName, url);
  };

  const validateCacheEntry = (cacheName, url, validateCb) => {
    let tries = 0;
    const maxRetires = 20;
    const intervalInMs = 1000;

    return new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        tries++;

        const response = await getCachedRequest(cacheName, url);
        if (response) {
          const isValid = validateCb(response);
          if (isValid) {
            clearInterval(intervalId);
            resolve();
          }
        } else if (tries > maxRetires) {
          clearInterval(intervalId);
          reject(`Request not found in cache: ${url}`);
        }
      }, intervalInMs);
    });
  };

  it(`should respond with a non-cached entry but stash request in a cache`, async function() {
    const cacheName = 'network-first';

    // Load the page and wait for the first service worker to register and activate.
    await global.__workbox.webdriver.get(testingUrl);
    await activateAndControlSW(swUrl);

    let response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(new URL(`/test/uniqueValue`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    });
    const firstResponse = response.trim();
    expect(firstResponse).to.not.equal('Cached');

    await validateCacheEntry(cacheName, `${testServerAddress}/test/uniqueValue`, (value) => {
      return value === firstResponse;
    });

    response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(new URL(`/test/uniqueValue`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    });
    const secondResponse = response.trim();
    expect(secondResponse).to.not.equal(firstResponse);

    await validateCacheEntry(cacheName, `${testServerAddress}/test/uniqueValue`, (value) => {
      return value === secondResponse;
    });
  });
});
