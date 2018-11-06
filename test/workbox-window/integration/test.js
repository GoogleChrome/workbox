/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {expect} = require('chai');

const activateAndControlSW = require('../../../infra/testing/activate-and-control');


const executeAsyncAndCatch = async (...args) => {
  const result = await global.__workbox.webdriver.executeAsyncScript(...args);

  if (result && result.error) {
    console.error(result.error);
    throw new Error('Error executing async script');
  }
  return result;
}


describe(`[workbox-window] Workbox`, function() {
  const testServerAddress = global.__workbox.server.getAddress();
  const testingUrl = `${testServerAddress}/test/workbox-window/static/`;

  before(async function() {
    await global.__workbox.webdriver.get(testingUrl);
  });

  describe('constructor', () => {
    it(`notifies a controlling SW that the window is ready`, async function() {
      const swUrl = `${testingUrl}window-ready-sw.js`;
      await activateAndControlSW(swUrl);

      const result = await executeAsyncAndCatch(async (swUrl, cb) => {
        try {
          const readyMessageReceived = new Promise((resolve) => {
            const sw = navigator.serviceWorker.controller;
            navigator.serviceWorker.addEventListener('message', (event) => {
              if (event.data.type === 'sw:message:ready') {
                resolve();
              }
            })
          });

          const wb = new Workbox(swUrl);
          await readyMessageReceived;

          cb(true);
        } catch (err) {
          cb({error: err.stack});
        }
      }, swUrl);
      expect(result).to.equal(true);
    });
  });

  describe('register', () => {
    it(`registers a new service worker`, async function() {
      const result = await executeAsyncAndCatch(async (cb) => {
        try {
          const wb = new Workbox('window-ready-sw.js');
          const reg = await wb.register();
          const result = {scriptUrl: reg.installing.scriptURL};

          await wb.unregister();
          cb(result);
        } catch (err) {
          cb({error: err.stack});
        }
      });
      expect(result.scriptUrl).to.equal(testingUrl + 'window-ready-sw.js');
    });
  });

  describe('unregister', () => {
    it(`unregister a registered service worker`, async function() {
      const result = await executeAsyncAndCatch(async (cb) => {
        try {
          const wb = new Workbox('window-ready-sw.js');
          const reg = await wb.register();

          const regsBefore = await navigator.serviceWorker.getRegistrations();
          await wb.unregister();
          const regsAfter = await navigator.serviceWorker.getRegistrations();

          cb({
            regsBefore: regsBefore.length,
            regsAfter: regsAfter.length,
          });
        } catch (err) {
          cb({error: err.stack});
        }
      });

      expect(result.regsBefore).to.equal(1);
      expect(result.regsAfter).to.equal(0);
    });
  });
});
