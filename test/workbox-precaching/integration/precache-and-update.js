const expect = require('chai').expect;
const seleniumAssistant = require('selenium-assistant');

describe(`[workbox-precaching] Precache and Update`, function() {
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
        cb(err);
      });
    }, swFile);
    if (error) {
      throw error;
    }
  };

  it(`should load a page with service worker `, async function() {
    const testingURl = `${testServerAddress}/test/workbox-precaching/static/precache-and-update/`;
    const SW_1_URL = `${testingURl}sw-1.js`;
    const SW_2_URL = `${testingURl}sw-2.js`;

    // Load the page and wait for the first service worker to register and activate.
    await webdriver.get(testingURl);

    // Precaching will cache bust with a search param in some situations.
    const needsCacheBustSearchParam = await webdriver.executeScript(() => {
      return !('cache' in Request.prototype);
    });

    // Register the first service worker.
    await activateSW(SW_1_URL);

    // Check that only the precache cache was created.
    const keys = await webdriver.executeAsyncScript((cb) => {
      caches.keys()
      .then((keys) => {
        cb(keys);
      });
    });
    expect(keys).to.deep.equal([
      'workbox-precache-http://localhost:3004/test/workbox-precaching/static/precache-and-update/',
    ]);

    // Check that the cached requests are what we expect for sw-1.js
    let cachedRequests = await webdriver.executeAsyncScript((cacheName, cb) => {
      caches.open(cacheName)
      .then((cache) => {
        return cache.keys();
      })
      .then((keys) => {
        cb(
          keys.map((request) => request.url).sort()
        );
      });
    }, keys[0]);
    expect(cachedRequests).to.deep.equal([
      'http://localhost:3004/test/workbox-precaching/static/precache-and-update/index.html',
      'http://localhost:3004/test/workbox-precaching/static/precache-and-update/styles/index.css',
    ]);

    // Make sure the requested URL's include cache busting search param if needed.
    let requestsMade = global.__workbox.server.getRequests();
    expect(requestsMade['/test/workbox-precaching/static/precache-and-update/']).to.equal(1);
    if (needsCacheBustSearchParam) {
      expect(requestsMade['/test/workbox-precaching/static/precache-and-update/styles/index.css']).to.equal(1);
      expect(requestsMade['/test/workbox-precaching/static/precache-and-update/index.html?_workbox-cache-bust=1']).to.equal(1);
      expect(requestsMade['/test/workbox-precaching/static/precache-and-update/styles/index.css?_workbox-cache-bust=1']).to.equal(1);
    } else {
      expect(requestsMade['/test/workbox-precaching/static/precache-and-update/styles/index.css']).to.equal(2);
      expect(requestsMade['/test/workbox-precaching/static/precache-and-update/index.html']).to.equal(1);
    }

    // Request the page and check that the precached assets weren't requested from the network
    global.__workbox.server.reset();
    await webdriver.get(testingURl);
    requestsMade = global.__workbox.server.getRequests();
    expect(requestsMade['/test/workbox-precaching/static/precache-and-update/']).to.equal(undefined);
    expect(requestsMade['/test/workbox-precaching/static/precache-and-update/index.html']).to.equal(undefined);
    expect(requestsMade['/test/workbox-precaching/static/precache-and-update/styles/index.css']).to.equal(undefined);

    // This is a crude way to fake an updated service worker.
    const error = await webdriver.executeAsyncScript((SW_1_URL, cb) => {
      navigator.serviceWorker.getRegistration()
      .then((reg) => reg.unregister(SW_1_URL))
      .then(() => cb())
      .catch((err) => cb(err.message));
    }, SW_1_URL);
    if (error) {
      throw error;
    }

    // Activate the second service worker
    await activateSW(SW_2_URL);

    // Ensure that the new assets were requested and cache busted.
    requestsMade = global.__workbox.server.getRequests();
    if (needsCacheBustSearchParam) {
      expect(requestsMade['/test/workbox-precaching/static/precache-and-update/index.html?_workbox-cache-bust=2']).to.equal(1);
      expect(requestsMade['/test/workbox-precaching/static/precache-and-update/new-request.txt?_workbox-cache-bust=2']).to.equal(1);
    } else {
      expect(requestsMade['/test/workbox-precaching/static/precache-and-update/index.html']).to.equal(1);
      expect(requestsMade['/test/workbox-precaching/static/precache-and-update/new-request.txt']).to.equal(1);
    }

    // Check that the cached entries were deleted / added as expected when
    // updating from sw-1.js to sw-2.js
    cachedRequests = await webdriver.executeAsyncScript((cacheName, cb) => {
      caches.open(cacheName)
      .then((cache) => {
        return cache.keys();
      })
      .then((keys) => {
        cb(
          keys.map((request) => request.url).sort()
        );
      });
    }, keys[0]);
    expect(cachedRequests).to.deep.equal([
      'http://localhost:3004/test/workbox-precaching/static/precache-and-update/index.html',
      'http://localhost:3004/test/workbox-precaching/static/precache-and-update/new-request.txt',
    ]);

    // Refresh the page and test that the requests are as expected
    global.__workbox.server.reset();
    await webdriver.get(testingURl);
    requestsMade = global.__workbox.server.getRequests();
    // Ensure the HTML page is returned from cache and not network
    expect(requestsMade['/test/workbox-precaching/static/precache-and-update/']).to.equal(undefined);
    // Ensure the now deleted index.css file is returned from network and not cache.
    expect(requestsMade['/test/workbox-precaching/static/precache-and-update/styles/index.css']).to.equal(1);
  });
});
