/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

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
  const testPageURL = `${testServerAddress}/test/workbox-sw/static/integration/`;

  before(async function() {
    await global.__workbox.webdriver.get(testPageURL);
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
