/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const cleanSWEnv = require('../../../infra/testing/clean-sw');
const {runUnitTests} = require('../../../infra/testing/webdriver/runUnitTests');

// Store local references of these globals.
const {webdriver, server} = global.__workbox;

describe(`[workbox-range-requests]`, function () {
  it(`passes all SW unit tests`, async function () {
    await runUnitTests('/test/workbox-range-requests/sw/');
  });
});

describe(`[workbox-range-requests] Plugin`, function () {
  const testServerAddress = server.getAddress();
  const testingURL = `${testServerAddress}/test/workbox-range-requests/static/`;

  beforeEach(async function () {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(webdriver, testingURL);
  });

  it(`should return a partial response that satisfies the request's Range: header, and an error response when it can't be satisfied`, async function () {
    const swURL = `${testingURL}sw.js`;
    await activateAndControlSW(swURL);

    const dummyURL = `this-file-doesnt-exist.txt`;

    const partialResponseBody = await webdriver.executeAsyncScript(
      (dummyURL, cb) => {
        // Prime the cache, and then make the Range: request.
        fetch(new Request(dummyURL, {headers: {Range: `bytes=5-6`}}))
          .then((response) => response.text())
          .then((text) => cb(text))
          .catch((error) => cb(error.message));
      },
      dummyURL,
    );

    // The values used for the byte range are inclusive, so we'll end up with
    // 11 characters returned in the partial response.
    expect(partialResponseBody).to.eql('56');

    const errorResponseStatus = await webdriver.executeAsyncScript(
      (dummyURL, cb) => {
        // These are arbitrary large values that extend past the end of the file.
        fetch(new Request(dummyURL, {headers: {Range: `bytes=100-101`}})).then(
          (response) => cb(response.status),
        );
      },
      dummyURL,
    );

    // The expected error status is 416 (Range Not Satisfiable)
    expect(errorResponseStatus).to.eql(416);
  });
});
