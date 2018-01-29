const expect = require('chai').expect;
const seleniumAssistant = require('selenium-assistant');

describe(`[workbox-strategies] StaleWhileRevalidate Requests`, function() {
  let webdriver;
  let testServerAddress = global.__workbox.server.getAddress();

  beforeEach(async function() {
    if (webdriver) {
      await seleniumAssistant.killWebDriver(webdriver);
      webdriver = null;
    }

    global.__workbox.server.reset();

    // Allow async functions 10s to complete
    webdriver = await global.__workbox.seleniumBrowser.getSeleniumDriver();
    webdriver.manage().timeouts().setScriptTimeout(30 * 1000);
  });

  after(async function() {
    if (webdriver) {
      await seleniumAssistant.killWebDriver(webdriver);
    }
  });

  const activateSW = async (swFile) => {
    const error = await webdriver.executeAsyncScript((swFile, cb) => {
      navigator.serviceWorker.register(swFile)
      .then(() => {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (navigator.serviceWorker.controller.scriptURL.endsWith(swFile)) {
            cb();
          }
        });
      })
      .catch((err) => {
        cb(err);
      });
    }, swFile);
    if (error) {
      throw error;
    }
  };

  const getCachedRequest = (cacheName, url) => {
    return webdriver.executeAsyncScript((cacheName, url, cb) => {
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
    const testingURl = `${testServerAddress}/test/workbox-strategies/static/stale-while-revalidate/`;
    const SW_URL = `${testingURl}sw.js`;
    const cacheName = 'stale-while-revalidate';

    // Load the page and wait for the first service worker to register and activate.
    await webdriver.get(testingURl);

    // Register the first service worker.
    await activateSW(SW_URL);

    let response = await webdriver.executeAsyncScript((cb) => {
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
    response = await webdriver.executeAsyncScript((cb) => {
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
