const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');

describe(`[workbox-routing] Basic Route`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-routing/static/routing-basic/`;
  const swUrl = `${testingUrl}sw.js`;

  before(async function() {
    await global.__workbox.webdriver.get(testingUrl);
    await activateAndControlSW(swUrl);
  });

  it(`should honor a route created by a Route object`, async function() {
    const testUrl = `${testServerAddress}/routeObject`;
    const responseBody = await global.__workbox.webdriver.executeAsyncScript((testUrl, cb) => {
      fetch(testUrl)
          .then((response) => response.text())
          .then((responseBody) => cb(responseBody))
          .catch((err) => cb(err.message));
    }, testUrl);

    expect(responseBody).to.eql(testUrl);
  });

  it(`should honor a same-origin route created by a string`, async function() {
    const testUrl = `${testServerAddress}/sameOrigin`;
    const responseBody = await global.__workbox.webdriver.executeAsyncScript((testUrl, cb) => {
      fetch(testUrl)
          .then((response) => response.text())
          .then((responseBody) => cb(responseBody))
          .catch((err) => cb(err.message));
    }, testUrl);

    expect(responseBody).to.eql(testUrl);
  });

  it(`should honor a cross-origin route created by a string`, async function() {
    const testUrl = 'https://example.com/crossOrigin';
    const responseBody = await global.__workbox.webdriver.executeAsyncScript((testUrl, cb) => {
      fetch(testUrl)
          .then((response) => response.text())
          .then((responseBody) => cb(responseBody))
          .catch((err) => cb(err.message));
    }, testUrl);

    expect(responseBody).to.eql(testUrl);
  });

  it(`should return a 404 when passed a URL that isn't routed and doesn't exist`, async function() {
    const testUrl = `${testServerAddress}/doesNotMatch`;
    const responseStatus = await global.__workbox.webdriver.executeAsyncScript((testUrl, cb) => {
      fetch(testUrl)
          .then((response) => cb(response.status))
          .catch((err) => cb(err.message));
    }, testUrl);

    expect(responseStatus).to.eql(404);
  });
});
