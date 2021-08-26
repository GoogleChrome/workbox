/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const {runUnitTests} = require('../../../infra/testing/webdriver/runUnitTests');
const {
  IframeManager,
} = require('../../../infra/testing/webdriver/IframeManager');
const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const cleanSWEnv = require('../../../infra/testing/clean-sw');
const templateData = require('../../../infra/testing/server/template-data');

// Store local references of these globals.
const {webdriver, server} = global.__workbox;

describe(`[workbox-broadcast-update]`, function () {
  it(`passes all SW unit tests`, async function () {
    await runUnitTests('/test/workbox-broadcast-update/sw/');
  });
});

describe(`[workbox-broadcast-update] Plugin`, function () {
  const testServerAddress = server.getAddress();
  const testingURL = `${testServerAddress}/test/workbox-broadcast-update/static/`;
  const swURL = `${testingURL}sw.js`;
  const apiURL = `${testServerAddress}/__WORKBOX/uniqueETag`;

  beforeEach(async function () {
    // Navigate to our test page and clear all caches before this test runs.
    await cleanSWEnv(global.__workbox.webdriver, testingURL);
    await activateAndControlSW(swURL);
  });

  it(`should broadcast a message when there's a cache update to a regular request`, async function () {
    // Fetch `apiURL`, which should put it in the cache (but not trigger an update)
    const err1 = await webdriver.executeAsyncScript((apiURL, cb) => {
      fetch(apiURL)
        .then(() => cb())
        .catch((err) => cb(err.message));
    }, apiURL);
    expect(err1).to.not.exist;

    // Fetch `apiURL` again, which should trigger an update message.
    const err2 = await webdriver.executeAsyncScript((apiURL, cb) => {
      fetch(apiURL)
        .then(() => cb())
        .catch((err) => cb(err.message));
    }, apiURL);
    expect(err2).to.not.exist;

    await webdriver.wait(() => {
      return webdriver.executeScript(() => {
        return window.__messages.length > 0;
      });
    });

    const messages = await webdriver.executeScript(() => {
      return window.__messages;
    });

    expect(messages.length).to.equal(1);
    expect(messages[0]).to.deep.equal({
      type: 'CACHE_UPDATED',
      meta: 'workbox-broadcast-update',
      payload: {
        cacheName: 'bcu-integration-test',
        updatedURL: apiURL,
      },
    });
  });

  it(`should broadcast a message when there's a cache update to a navigation request`, async function () {
    templateData.assign({
      title: 'Broadcast Cache Update Test',
      body: 'Second test, initial body.',
      script: `
        window.__messages = [];
        navigator.serviceWorker.addEventListener('message', (event) => {
          window.__messages.push(event.data);
        });
      `,
    });

    const dynamicPageURL = testingURL + 'integration.html.njk?second';

    // Navigate to a dynamic page whose content can be updated from with this
    // test, and wait until the cache is populated.
    await webdriver.get(dynamicPageURL);
    await webdriver.wait(async () => {
      return webdriver.executeAsyncScript(async (url, cb) => {
        cb(await caches.match(url));
      }, dynamicPageURL);
    });

    // Update the template data with new content,
    // then refresh and wait until the update message is received.
    templateData.assign({
      body: 'Second test, with and updated body.',
    });

    await webdriver.get(webdriver.getCurrentUrl());

    await webdriver.wait(() => {
      return webdriver.executeScript(() => {
        return window.__messages.length > 0;
      });
    });

    const messages = await webdriver.executeScript(() => {
      return window.__messages;
    });

    expect(messages.length).to.equal(1);
    expect(messages[0]).to.deep.equal({
      type: 'CACHE_UPDATED',
      meta: 'workbox-broadcast-update',
      payload: {
        cacheName: 'bcu-integration-test',
        updatedURL: dynamicPageURL,
      },
    });
  });

  it(`should broadcast a message to all open window clients by default`, async function () {
    const iframeManager = new IframeManager(webdriver);

    templateData.assign({
      title: 'Broadcast Cache Update Test',
      body: 'Third test, initial body.',
      script: `
        window.__messages = [];
        navigator.serviceWorker.addEventListener('message', (event) => {
          window.__messages.push(event.data);
        });
      `,
    });

    const dynamicPageURL = testingURL + 'integration.html.njk?third';

    // Navigate to a dynamic page whose content can be updated from with this
    // test, and wait until the cache is populated.
    await webdriver.get(dynamicPageURL);
    await webdriver.wait(async () => {
      return webdriver.executeAsyncScript(async (url, cb) => {
        cb(await caches.match(url));
      }, dynamicPageURL);
    });

    // Update the template data and open an iframe to trigger the cache update.
    templateData.assign({
      body: 'Third test, with an updated body.',
    });
    await iframeManager.createIframeClient(dynamicPageURL);

    await webdriver.wait(() => {
      return webdriver.executeScript(() => {
        return window.__messages.length > 0;
      });
    });

    const tab1Messages = await webdriver.executeScript(() => {
      return window.__messages;
    });

    expect(tab1Messages).to.eql([
      {
        type: 'CACHE_UPDATED',
        meta: 'workbox-broadcast-update',
        payload: {
          cacheName: 'bcu-integration-test',
          updatedURL: dynamicPageURL,
        },
      },
    ]);
  });

  it(`should only broadcast a message to the client that made the request when notifyAllClients is false`, async function () {
    const url = `${apiURL}?notifyAllClientsTest`;
    const iframeManager = new IframeManager(webdriver);

    await webdriver.get(testingURL);
    await webdriver.executeAsyncScript((url, cb) => {
      fetch(url)
        .then(() => cb())
        .catch((err) => cb(err.message));
    }, url);

    const iframeClient = await iframeManager.createIframeClient(testingURL);
    await iframeClient.executeAsyncScript(`fetch(${JSON.stringify(url)})`);
    await iframeClient.wait('window.__messages.length > 0');

    const populatedMessages = await iframeClient.executeAsyncScript(
      'window.__messages',
    );
    expect(populatedMessages).to.eql([
      {
        type: 'CACHE_UPDATED',
        meta: 'workbox-broadcast-update',
        payload: {
          cacheName: 'bcu-integration-test',
          updatedURL: url,
        },
      },
    ]);

    const unpopulatedMessages = await webdriver.executeScript(() => {
      return window.__messages;
    });
    expect(unpopulatedMessages).to.be.empty;
  });
});
