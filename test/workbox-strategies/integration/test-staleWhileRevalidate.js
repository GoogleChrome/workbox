const expect = require('chai').expect;

const activateSW = require('../../../infra/testing/activate-sw');

describe(`[workbox-strategies] StaleWhileRevalidate Requests`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-strategies/static/stale-while-revalidate/`;
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

  it(`should respond with cached entry and update it`, async function() {
    const cacheName = 'stale-while-revalidate';

    // Load the page and wait for the first service worker to register and activate.
    await global.__workbox.webdriver.get(testingUrl);
    await activateSW(global.__workbox.webdriver, swUrl);

    let response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(new URL(`/test/uniqueValue`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    });
    const firstResponse = response.trim();

    // The first response should be cached.
    await validateCacheEntry(cacheName, `${testServerAddress}/test/uniqueValue`, (value) => {
      return value === firstResponse;
    });

    // This request should come from cache and not the server
    response = await global.__workbox.webdriver.executeAsyncScript((cb) => {
      fetch(new URL(`/test/uniqueValue`, location).href)
      .then((response) => response.text())
      .then((responseBody) => cb(responseBody))
      .catch((err) => cb(err.message));
    });
    const secondResponse = response.trim();
    expect(secondResponse).to.equal(firstResponse);

    // The entry should be updated after the response is returned
    await validateCacheEntry(cacheName, `${testServerAddress}/test/uniqueValue`, (value) => {
      return value !== secondResponse;
    });
  });
});
