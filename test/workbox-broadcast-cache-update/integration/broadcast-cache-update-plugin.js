const expect = require('chai').expect;
const seleniumAssistant = require('selenium-assistant');

describe(`broadcastCacheUpdate.Plugin`, function() {
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

  it(`should broadcast a message on the expected channel when there's a cache update`, async function() {
    const testPageUrl = `${testServerAddress}/test/workbox-broadcast-cache-update/static/`;
    const swUrl = `${testPageUrl}sw.js`;
    const apiUrl = `${testServerAddress}/test/uniqueETag`;

    await webdriver.get(testPageUrl);
    await activateSW(swUrl);

    await webdriver.executeAsyncScript((apiUrl, cb) => {
      // Call fetch(apiUrl) twice. Each response will include a different ETag,
      // which will trigger the BCU plugin's behavior.
      fetch(apiUrl)
        .then(() => fetch(apiUrl))
        .then(() => cb())
        .catch((err) => cb(err.message));
    }, apiUrl);

    const updateMessageEventData = await webdriver.executeAsyncScript((cb) => {
      // updateReceivedPromise is defined on the test page, and resolves when
      // the initial Broadcast Channel API Message event fires.
      window.updateReceivedPromise.then(cb);
    });

    expect(updateMessageEventData).to.deep.equal({
      meta: 'workbox-broadcast-cache-update',
      payload: {
        cacheName: 'bcu-integration-test',
        updatedUrl: apiUrl,
      },
      type: 'CACHE_UPDATED',
    });
  });
});
