const expect = require('chai').expect;

const activateSW = require('../../../infra/testing/activate-sw');

describe(`rangeRequests.Plugin`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-range-requests/static/`;
  const swUrl = `${testingUrl}sw.js`;

  it(`should return a partial response that satisfies the request's Range: header, and an error response when it can't be satisfied`, async function() {
    const dummyUrl = `${testingUrl}this-file-doesnt-exist.txt`;
    const dummyBody = '0123456789';

    await global.__workbox.webdriver.get(testingUrl);
    await activateSW(global.__workbox.webdriver, swUrl);

    const partialResponseBody = await global.__workbox.webdriver.executeAsyncScript((dummyUrl, dummyBody, cb) => {
      const dummyResponse = new Response(dummyBody);
      // Prime the cache, and then make the Range: request.
      caches.open('range-requests-integration-test')
        .then((cache) => cache.put(dummyUrl, dummyResponse))
        .then(() => fetch(new Request(dummyUrl, {headers: {Range: `bytes=5-6`}})))
        .then((response) => response.text())
        .then((text) => cb(text))
        .catch((error) => cb(error.message));
    }, dummyUrl, dummyBody);

    // The values used for the byte range are inclusive, so we'll end up with
    // 11 characters returned in the partial response.
    expect(partialResponseBody).to.eql('56');

    const errorResponse = await global.__workbox.webdriver.executeAsyncScript((dummyUrl, cb) => {
      // These are arbitrary large values that extend past the end of the file.
      fetch(new Request(dummyUrl, {headers: {Range: `bytes=100-101`}}))
        .then((response) => cb(response));
    }, dummyUrl);

    // The expected error status is 416 (Range Not Satisfiable)
    expect(errorResponse.status).to.eql(416);
  });
});
