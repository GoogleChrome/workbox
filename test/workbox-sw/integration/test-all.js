/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const {runUnitTests} = require('../../../infra/testing/webdriver/runUnitTests');

// Store local references of these globals.
const {webdriver, server} = global.__workbox;

describe(`[workbox-sw]`, function () {
  it(`passes all SW unit tests`, async function () {
    await runUnitTests('/test/workbox-sw/sw/');
  });
});

describe(`WorkboxSW interface`, function () {
  const wasRegistrationSuccessful = (swFile) => {
    return webdriver.executeAsyncScript((swFile, cb) => {
      // Invokes cb() with true when registration succeeds, and false otherwise.
      navigator.serviceWorker
        .register(swFile)
        .then(() => cb(true))
        .catch(() => cb(false));
    }, swFile);
  };

  const testServerAddress = server.getAddress();
  const testPageURL = `${testServerAddress}/test/workbox-sw/static/integration/`;

  before(async function () {
    await webdriver.get(testPageURL);
  });

  it(`should fail to activate an invalid SW which loads non-existent modules`, async function () {
    const invalidSW = 'invalid-sw.js';
    const outcome = await wasRegistrationSuccessful(invalidSW);
    expect(outcome).to.be.false;
  });

  it(`should be able to activate a SW which loads all valid modules`, async function () {
    const validSW = 'valid-sw.js';
    const outcome = await wasRegistrationSuccessful(validSW);
    expect(outcome).to.be.true;
  });
});
