const expect = require('chai').expect;
const seleniumAssistant = require('selenium-assistant');

describe(`WorkboxSW interface`, function() {
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

  const wasRegistrationSuccessful = (swFile) => {
    return webdriver.executeAsyncScript((swFile, cb) => {
      // Invokes cb() with true when registration succeeds, and false otherwise.
      navigator.serviceWorker.register(swFile)
        .then(() => cb(true))
        .catch(() => cb(false));
    }, swFile);
  };

  const testPageUrl = `${testServerAddress}/test/workbox-sw/static/integration/`;

  it(`should fail to activate an invalid SW which loads non-existent modules`, async function() {
    const invalidSW = 'invalid-sw.js';

    await webdriver.get(testPageUrl);
    const outcome = await wasRegistrationSuccessful(invalidSW);
    expect(outcome).to.be.false;
  });

  it(`should be able to activate a SW which loads all valid modules`, async function() {
    const validSW = 'valid-sw.js';

    await webdriver.get(testPageUrl);
    const outcome = await wasRegistrationSuccessful(validSW);
    expect(outcome).to.be.true;
  });
});
