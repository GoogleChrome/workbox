const expect = require('chai').expect;

describe(`WorkboxSW interface`, function() {
  const wasRegistrationSuccessful = (swFile) => {
    return global.__workbox.webdriver.executeAsyncScript((swFile, cb) => {
      // Invokes cb() with true when registration succeeds, and false otherwise.
      navigator.serviceWorker.register(swFile)
          .then(() => cb(true))
          .catch(() => cb(false));
    }, swFile);
  };

  const testServerAddress = global.__workbox.server.getAddress();
  const testPageUrl = `${testServerAddress}/test/workbox-sw/static/integration/`;

  before(async function() {
    await global.__workbox.webdriver.get(testPageUrl);
  });

  it(`should fail to activate an invalid SW which loads non-existent modules`, async function() {
    const invalidSW = 'invalid-sw.js';
    const outcome = await wasRegistrationSuccessful(invalidSW);
    expect(outcome).to.be.false;
  });

  it(`should be able to activate a SW which loads all valid modules`, async function() {
    const validSW = 'valid-sw.js';
    const outcome = await wasRegistrationSuccessful(validSW);
    expect(outcome).to.be.true;
  });
});
