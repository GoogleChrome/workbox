/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const activateAndControlSW = require('../../../infra/testing/activate-and-control');
const {runUnitTests} = require('../../../infra/testing/webdriver/runUnitTests');
const {openNewTab} = require('../../../infra/testing/webdriver/openNewTab');
const {getLastWindowHandle} = require('../../../infra/testing/webdriver/getLastWindowHandle');
const templateData = require('../../../infra/testing/server/template-data');


// Store local references of these globals.
const {webdriver, server} = global.__workbox;

describe(`[workbox-broadcast-update]`, function() {
  it(`passes all SW unit tests`, async function() {
    await runUnitTests('/test/workbox-broadcast-update/sw/');
  });
});

describe(`[workbox-broadcast-update] Plugin`, function() {
  const testServerAddress = server.getAddress();
  const testingURL = `${testServerAddress}/test/workbox-broadcast-update/static/`;
  const swURL = `${testingURL}sw.js`;
  const apiURL = `${testServerAddress}/__WORKBOX/uniqueETag`;

  it(`should broadcast a message when there's a cache update to a regular request`, async function() {
    await webdriver.get(testingURL);
    await activateAndControlSW(swURL);
    await clearAllCaches();

    // Fetch `apiURL`, which should put it in the cache (but not trigger an update)
    const err1 = await webdriver.executeAsyncScript((apiURL, cb) => {
      fetch(apiURL).then(() => cb()).catch((err) => cb(err.message));
    }, apiURL);
    expect(err1).to.not.exist;

    // Fetch `apiURL` again, which should trigger an update message.
    const err2 = await webdriver.executeAsyncScript((apiURL, cb) => {
      fetch(apiURL).then(() => cb()).catch((err) => cb(err.message));
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

  it(`should broadcast a message when there's a cache update to a navigation request`, async function() {
    await webdriver.get(testingURL);
    await activateAndControlSW(swURL);
    await clearAllCaches();

    templateData.assign({
      title: 'Broadcast Cache Update Test',
      body: '',
      script: `
        window.__messages = [];
        navigator.serviceWorker.addEventListener('message', (event) => {
          window.__messages.push(event.data);
        });
      `,
    });

    const dynamicPageURL = testingURL + 'integration.html.njk';

    // Navigate to a dynamic page whose content can be updated from with this
    // test, and wait until the cache is populated.
    await webdriver.get(dynamicPageURL);
    await webdriver.wait(async () => {
      return webdriver.executeAsyncScript(async (url, cb) => {
        cb(await caches.match(url));
      }, dynamicPageURL);
    });

    // Update the template data with new content,
    // then refresh and wait until the udpate message is received.
    templateData.assign({
      body: 'New content to change Content-Length!',
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

  it(`should broadcast a message to all open window clients`, async function() {
    await webdriver.get(testingURL);
    await activateAndControlSW(swURL);
    await clearAllCaches();

    templateData.assign({
      title: 'Broadcast Cache Update Test',
      body: '',
      script: `
        window.__messages = [];
        navigator.serviceWorker.addEventListener('message', (event) => {
          window.__messages.push(event.data);
        });
      `,
    });

    const dynamicPageURL = testingURL + 'integration.html.njk';

    // Navigate to a dynamic page whose content can be updated from with this
    // test, and wait until the cache is populated.
    await webdriver.get(dynamicPageURL);
    const tab1Handle = await getLastWindowHandle();
    await webdriver.wait(async () => {
      return webdriver.executeAsyncScript(async (url, cb) => {
        cb(await caches.match(url));
      }, dynamicPageURL);
    });

    // Update the template data with new content,
    // then open a new tab and wait until the udpate message is received.
    templateData.assign({
      body: 'New content to change Content-Length!',
    });
    await openNewTab(dynamicPageURL);
    await webdriver.wait(() => {
      return webdriver.executeScript(() => {
        return window.__messages.length > 0;
      });
    });

    const tab2Messsages = await webdriver.executeScript(() => {
      return window.__messages;
    });

    expect(tab2Messsages.length).to.equal(1);
    expect(tab2Messsages[0]).to.deep.equal({
      type: 'CACHE_UPDATED',
      meta: 'workbox-broadcast-update',
      payload: {
        cacheName: 'bcu-integration-test',
        updatedURL: dynamicPageURL,
      },
    });

    // Also assert a message was received on the first tab.
    await webdriver.switchTo().window(tab1Handle);
    const tab1Messsages = await webdriver.executeScript(() => {
      return window.__messages;
    });

    expect(tab1Messsages.length).to.equal(1);
    expect(tab1Messsages[0]).to.deep.equal({
      type: 'CACHE_UPDATED',
      meta: 'workbox-broadcast-update',
      payload: {
        cacheName: 'bcu-integration-test',
        updatedURL: dynamicPageURL,
      },
    });
  });
});

/**
 * Clears all caches for the origin of the currently open page.
 */
async function clearAllCaches() {
  await webdriver.executeAsyncScript(async (cb) => {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      await caches.delete(name);
    }
    cb();
  });
}
