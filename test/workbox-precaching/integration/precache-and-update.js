const expect = require('chai').expect;
const seleniumAssistant = require('selenium-assistant');

describe(`[workbox-precaching] Precache and Update`, function() {
  let webdriver;
  let testServerAddress = global.__workbox.serverAddr;

  beforeEach(async function() {
    if (webdriver) {
      await seleniumAssistant.killWebDriver(webdriver);
      webdriver = null;
    }

    // Allow async functions 10s to complete
    webdriver = await global.__workbox.seleniumBrowser.getSeleniumDriver();
    webdriver.manage().timeouts().setScriptTimeout(10 * 1000);
  });

  after(async function() {
    if (webdriver) {
      await seleniumAssistant.killWebDriver(webdriver);
    }
  });

  it(`should load a page with service worker `, async function() {
    const testing = `${testServerAddress}/test/workbox-precaching/static/precache-and-update/`;
    await webdriver.get(testing);
    await webdriver.wait(() => {
      return webdriver.executeAsyncScript((cb) => {
        navigator.serviceWorker.getRegistration()
        .then((registration) => {
          if (!registration) {
            return cb(false);
          }

          cb(registration.active !== null);
        });
      });
    }, 3 * 1000);

    const keys = await webdriver.executeAsyncScript((cb) => {
      caches.keys()
      .then((keys) => {
        cb(keys);
      });
    });

    expect(keys).to.deep.equal([
      'workbox-precache-http://localhost:3004/test/workbox-precaching/static/precache-and-update/',
    ]);

    const cachedRequests = await webdriver.executeAsyncScript((cacheName, cb) => {
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
  });
});
