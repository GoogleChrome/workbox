const expect = require('chai').expect;

const activateSW = require('../../../infra/testing/activate-sw');

describe(`[workbox-google-analytics] Load and use Google Analytics`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-google-analytics/static/basic-example/`;
  const swUrl = `${testingUrl}sw.js`;

  it(`should load a page with service worker`, async function() {
    // Load the page and wait for the first service worker to register and activate.
    await global.__workbox.webdriver.get(testingUrl);
    await activateSW(swUrl);

    const err = await global.__workbox.webdriver.executeAsyncScript((testingUrl, cb) => {
      return fetch('https://www.google-analytics.com/analytics.js', {mode: 'no-cors'})
      .then(() => cb(), (err) => cb(err.message));
    }, testingUrl);

    expect(err).to.not.exist;
  });
});
