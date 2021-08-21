/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');

describe(`[workbox-routing] Route via NavigationRoute`, function () {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingURL = `${testServerAddress}/test/workbox-routing/static/routing-navigation/`;
  const swURL = `${testingURL}sw.js`;

  it(`should load a page and route requests`, async function () {
    // Load the page and wait for the first service worker to register and activate.
    await global.__workbox.webdriver.get(testingURL);
    await activateAndControlSW(swURL);

    const nestedURL = `${testingURL}TestNavigationURL`;

    await global.__workbox.webdriver.get(nestedURL);

    const bodyText = await global.__workbox.webdriver.executeScript(() => {
      return document.body.textContent;
    });

    expect(bodyText).to.equal(`NavigationRoute.${nestedURL}`);
  });
});
