/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');

describe(`[workbox-routing] Basic Route`, function () {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingURL = `${testServerAddress}/test/workbox-routing/static/routing-basic/`;
  const swURL = `${testingURL}sw.js`;

  before(async function () {
    await global.__workbox.webdriver.get(testingURL);
    await activateAndControlSW(swURL);
  });

  it(`should honor a route created by a Route object`, async function () {
    const testURL = `${testServerAddress}/routeObject`;
    const responseBody = await global.__workbox.webdriver.executeAsyncScript(
      (testURL, cb) => {
        fetch(testURL)
          .then((response) => response.text())
          .then((responseBody) => cb(responseBody))
          .catch((err) => cb(err.message));
      },
      testURL,
    );

    expect(responseBody).to.eql(testURL);
  });

  it(`should honor a same-origin route created by a string`, async function () {
    const testURL = `${testServerAddress}/sameOrigin`;
    const responseBody = await global.__workbox.webdriver.executeAsyncScript(
      (testURL, cb) => {
        fetch(testURL)
          .then((response) => response.text())
          .then((responseBody) => cb(responseBody))
          .catch((err) => cb(err.message));
      },
      testURL,
    );

    expect(responseBody).to.eql(testURL);
  });

  it(`should honor a cross-origin route created by a string`, async function () {
    const testURL = 'https://example.com/crossOrigin';
    const responseBody = await global.__workbox.webdriver.executeAsyncScript(
      (testURL, cb) => {
        fetch(testURL)
          .then((response) => response.text())
          .then((responseBody) => cb(responseBody))
          .catch((err) => cb(err.message));
      },
      testURL,
    );

    expect(responseBody).to.eql(testURL);
  });

  it(`should return a 404 when passed a URL that isn't routed and doesn't exist`, async function () {
    const testURL = `${testServerAddress}/doesNotMatch`;
    const responseStatus = await global.__workbox.webdriver.executeAsyncScript(
      (testURL, cb) => {
        fetch(testURL)
          .then((response) => cb(response.status))
          .catch((err) => cb(err.message));
      },
      testURL,
    );

    expect(responseStatus).to.eql(404);
  });
});
