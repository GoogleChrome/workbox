const expect = require('chai').expect;
const seleniumAssistant = require('selenium-assistant');

describe(`expiration.Plugin`, function() {
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
    webdriver.manage().timeouts().setScriptTimeout(10 * 1000);
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
        cb(err.message);
      });
    }, swFile);
    if (error) {
      throw error;
    }
  };

  const getCachedRequests = (cacheName) => {
    return webdriver.executeAsyncScript((cacheName, cb) => {
      caches.open(cacheName)
      .then((cache) => {
        return cache.keys();
      })
      .then((keys) => {
        cb(
          keys.map((request) => request.url).sort()
        );
      });
    }, cacheName);
  };

  it(`should load a page with entries managed by maxEntries`, async function() {
    const testingURl = `${testServerAddress}/test/workbox-cache-expiration/static/expiration-plugin/`;
    const SW_URL = `${testingURl}sw-max-entries.js`;

    // Load the page and wait for the first service worker to register and activate.
    await webdriver.get(testingURl);

    // Register the service worker.
    await activateSW(SW_URL);

    await webdriver.executeAsyncScript((testingURl, cb) => {
      fetch(`${testingURl}example-1.txt`).then(() => cb()).catch((err) => cb(err.message));
    }, testingURl);

    // Caching is done async from returning a response, so we may need
    // to wait before the cache has some content.
    await webdriver.wait(async () => {
      return await webdriver.executeAsyncScript((cb) => {
        caches.keys().then((keys) => cb(keys.length > 0));
      });
    });

    const keys = await webdriver.executeAsyncScript((cb) => {
      caches.keys().then(cb);
    });

    expect(keys).to.deep.equal([
      'expiration-plugin-max-entries',
    ]);

    let cachedRequests = await getCachedRequests(keys[0]);
    expect(cachedRequests).to.deep.equal([
      `${testingURl}example-1.txt`,
    ]);

    await webdriver.executeAsyncScript((testingURl, cb) => {
      fetch(`${testingURl}example-2.txt`).then(() => cb()).catch((err) => cb(err.message));
    }, testingURl);

    // Caching is done async from returning a response, so we may need
    // to wait before the cache has be cleaned up.
    let waitForCleanup = true;
    while (waitForCleanup) {
      cachedRequests = await getCachedRequests(keys[0]);
      if (cachedRequests.length !== 1) {
        continue;
      }

      if (cachedRequests[0] !== `${testingURl}example-2.txt`) {
        continue;
      }

      waitForCleanup = false;
    }

    // If the code path reaches here - the clean up from expiration was
    // successful
  });

  it(`should load a page with entries managed by maxAgeSeconds`, async function() {
    const testingURl = `${testServerAddress}/test/workbox-cache-expiration/static/expiration-plugin/`;
    const SW_URL = `${testingURl}sw-max-age-seconds.js`;

    // Load the page and wait for the first service worker to register and activate.
    await webdriver.get(testingURl);

    // Register the service worker.
    await activateSW(SW_URL);

    await webdriver.executeAsyncScript((testingURl, cb) => {
      fetch(`${testingURl}example-1.txt`).then(() => cb()).catch((err) => cb(err.message));
    }, testingURl);

    // Caching is done async from returning a response, so we may need
    // to wait before the cache has some content.
    await webdriver.wait(async () => {
      return await webdriver.executeAsyncScript((cb) => {
        caches.keys().then((keys) => cb(keys.length > 0));
      });
    });

    const keys = await webdriver.executeAsyncScript((cb) => {
      caches.keys().then(cb);
    });

    expect(keys).to.deep.equal([
      'expiration-plugin-max-entries',
    ]);

    let cachedRequests = await getCachedRequests(keys[0]);
    expect(cachedRequests).to.deep.equal([
      `${testingURl}example-1.txt`,
    ]);

    // Wait 1.5 seconds to expire entry.
    await new Promise((resolve) => {
      setTimeout(resolve, 1500);
    });

    await webdriver.executeAsyncScript((testingURl, cb) => {
      fetch(`${testingURl}example-2.txt`).then(() => cb()).catch((err) => cb(err.message));
    }, testingURl);

    // Caching is done async from returning a response, so we may need
    // to wait before the cache has be cleaned up.
    let waitForCleanup = true;
    while (waitForCleanup) {
      cachedRequests = await getCachedRequests(keys[0]);
      if (cachedRequests.length !== 1) {
        continue;
      }

      if (cachedRequests[0] !== `${testingURl}example-2.txt`) {
        continue;
      }

      waitForCleanup = false;
    }

    // If the code path reaches here - the clean up from expiration was
    // successful
  });
});
