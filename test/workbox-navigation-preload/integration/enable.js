const expect = require('chai').expect;

const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const cleanSWEnv = require('../../../infra/testing/clean-sw');
const runInSW = require('../../../infra/testing/comlink/node-interface');

describe(`navigationPreload.enable`, function() {
  const staticPath = `/test/workbox-navigation-preload/static/`;
  const baseUrl = global.__workbox.server.getAddress() + staticPath;
  const integrationUrl = `${baseUrl}integration.html`;
  const integrationUrlPath = `${staticPath}integration.html`;

  beforeEach(async function() {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, integrationUrl);
  });

  it(`should make a network request if navigation preload is supported`, async function() {
    await activateAndControlSW(`${baseUrl}sw.js`);

    const isEnabled = await runInSW('isNavigationPreloadSupported');

    // Clear request counters.
    global.__workbox.server.reset();

    let serverRequests = global.__workbox.server.getRequests();
    expect(serverRequests[integrationUrlPath]).to.be.undefined;

    await global.__workbox.webdriver.get(integrationUrl);
    serverRequests = global.__workbox.server.getRequests();
    expect(serverRequests[integrationUrlPath]).to.eql(isEnabled ? 1 : undefined);
  });
});
