const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');

describe(`[workbox-routing] Route via NavigationRoute`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-routing/static/routing-navigation/`;
  const swUrl = `${testingUrl}sw.js`;

  it(`should load a page and route requests`, async function() {
    // Load the page and wait for the first service worker to register and activate.
    await global.__workbox.webdriver.get(testingUrl);
    await activateAndControlSW(swUrl);

    const nestedUrl = `${testingUrl}TestNavigationURL`;

    await global.__workbox.webdriver.get(nestedUrl);

    const bodyText = await global.__workbox.webdriver.executeScript(() => {
      return document.body.textContent;
    });

    expect(bodyText).to.equal(`NavigationRoute.${nestedUrl}`);
  });
});
