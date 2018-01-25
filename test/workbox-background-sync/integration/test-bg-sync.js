const expect = require('chai').expect;
const seleniumAssistant = require('selenium-assistant');

describe(`[workbox-background-sync] Load and use Background Sync`, function() {
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
    const testingUrl = `${testServerAddress}/test/workbox-background-sync/static/basic-example/`;
    const SW_URL = `${testingUrl}sw.js`;

    // Load the page and wait for the first service worker to register and activate.
    await webdriver.get(testingUrl);

    // Register the first service worker.
    await activateSW(SW_URL);

    const err = await webdriver.executeAsyncScript((testingUrl, cb) => {
      return fetch(`${testingUrl}example.txt`)
      .then(() => cb(), (err) => cb(err.message));
    }, testingUrl);

    expect(err).to.not.exist;

    await waitUntilRequestMade(`/test/workbox-background-sync/static/basic-example/example.txt`, 20, 500);
  });
});
