/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');

describe(`[workbox-routing] Route via RegExp`, function () {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingURL = `${testServerAddress}/test/workbox-routing/static/routing-regex/`;
  const swURL = `${testingURL}sw.js`;

  it(`should load a page and route requests`, async function () {
    // Load the page and wait for the first service worker to register and activate.
    await global.__workbox.webdriver.get(testingURL);
    await activateAndControlSW(swURL);

    let testCounter = 0;

    let response = await global.__workbox.webdriver.executeAsyncScript(
      (testCounter, cb) => {
        fetch(new URL(`/RegExp/${testCounter}/`, location).href)
          .then((response) => response.text())
          .then((responseBody) => cb(responseBody))
          .catch((err) => cb(err.message));
      },
      testCounter,
    );

    expect(response).to.equal(
      `RegExp.${testServerAddress}/RegExp/${testCounter}/`,
    );

    testCounter += 1;

    response = await global.__workbox.webdriver.executeAsyncScript(
      (testCounter, cb) => {
        fetch(new URL(`/regular-expression/${testCounter}/`, location).href)
          .then((response) => response.text())
          .then((responseBody) => cb(responseBody))
          .catch((err) => cb(err.message));
      },
      testCounter,
    );

    expect(response).to.equal(
      `regular-expression.${testServerAddress}/regular-expression/${testCounter}/`,
    );

    testCounter += 1;

    response = await global.__workbox.webdriver.executeAsyncScript(
      (testCounter, cb) => {
        fetch(new URL(`/RegExpRoute/RegExp/${testCounter}/`, location).href)
          .then((response) => response.text())
          .then((responseBody) => cb(responseBody))
          .catch((err) => cb(err.message));
      },
      testCounter,
    );

    expect(response).to.equal(
      `RegExpRoute.RegExp.${testServerAddress}/RegExpRoute/RegExp/${testCounter}/`,
    );

    testCounter += 1;

    response = await global.__workbox.webdriver.executeAsyncScript(
      (testCounter, cb) => {
        fetch(
          new URL(`/RegExpRoute/regular-expression/${testCounter}/`, location)
            .href,
        )
          .then((response) => response.text())
          .then((responseBody) => cb(responseBody))
          .catch((err) => cb(err.message));
      },
      testCounter,
    );

    expect(response).to.equal(
      `RegExpRoute.regular-expression.${testServerAddress}/RegExpRoute/regular-expression/${testCounter}/`,
    );
  });
});
