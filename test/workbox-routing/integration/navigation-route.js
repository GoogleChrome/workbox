const expect = require('chai').expect;
const seleniumAssistant = require('selenium-assistant');

describe(`[workbox-routing] Route via NavigationRoute`, function() {
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

  it(`should load a page and route requests`, async function() {
    const testingURl = `${testServerAddress}/test/workbox-routing/static/routing-navigation/`;
    const SW_URL = `${testingURl}sw.js`;

    // Load the page and wait for the first service worker to register and activate.
    await webdriver.get(testingURl);

    // Register the service worker.
    await activateSW(SW_URL);

    const nestedUrl = `${testingURl}TestNavigationURL`;
    await webdriver.get(nestedUrl);
    const bodyText = await webdriver.executeScript(() => {
      return document.body.textContent;
    });

    expect(bodyText).to.equal(`NavigationRoute.${nestedUrl}`);
  });
});
