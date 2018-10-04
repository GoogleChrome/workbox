const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const cleanSWEnv = require('../../../infra/testing/clean-sw');

describe(`rangeRequests.Plugin`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-range-requests/static/`;

  beforeEach(async function() {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, testingUrl);
  });

  it(`should return a partial response that satisfies the request's Range: header, and an error response when it can't be satisfied`, async function() {
    const swUrl = `${testingUrl}sw.js`;
    await activateAndControlSW(swUrl);

    const dummyUrl = `this-file-doesnt-exist.txt`;

    const partialResponseBody = await global.__workbox.webdriver.executeAsyncScript((dummyUrl, cb) => {
      // Prime the cache, and then make the Range: request.
      fetch(new Request(dummyUrl, {headers: {Range: `bytes=5-6`}}))
          .then((response) => response.text())
          .then((text) => cb(text))
          .catch((error) => cb(error.message));
    }, dummyUrl);

    // The values used for the byte range are inclusive, so we'll end up with
    // 11 characters returned in the partial response.
    expect(partialResponseBody).to.eql('56');

    const errorResponseStatus = await global.__workbox.webdriver.executeAsyncScript((dummyUrl, cb) => {
      // These are arbitrary large values that extend past the end of the file.
      fetch(new Request(dummyUrl, {headers: {Range: `bytes=100-101`}}))
          .then((response) => cb(response.status));
    }, dummyUrl);

    // The expected error status is 416 (Range Not Satisfiable)
    expect(errorResponseStatus).to.eql(416);
  });
});
