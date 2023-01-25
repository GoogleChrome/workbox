/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {expect} = require('chai');

const {
  executeAsyncAndCatch,
} = require('../../../infra/testing/webdriver/executeAsyncAndCatch');
const {runUnitTests} = require('../../../infra/testing/webdriver/runUnitTests');
const {
  IframeManager,
} = require('../../../infra/testing/webdriver/IframeManager');
const {
  unregisterAllSWs,
} = require('../../../infra/testing/webdriver/unregisterAllSWs');
const {windowLoaded} = require('../../../infra/testing/webdriver/windowLoaded');
const templateData = require('../../../infra/testing/server/template-data');

// Store local references of these globals.
const {webdriver, server} = global.__workbox;

const testServerOrigin = server.getAddress();
const testPath = `${testServerOrigin}/test/workbox-window/static/`;

describe(`[workbox-window]`, function () {
  it(`passes all window unit tests`, async function () {
    await runUnitTests('/test/workbox-window/window/');
  });
});

describe(`[workbox-window] Workbox`, function () {
  beforeEach(async function () {
    templateData.assign({version: '1'});
    await webdriver.get(testPath);
    await windowLoaded();
  });

  afterEach(async function () {
    try {
      await unregisterAllSWs();
    } catch (error) {
      // no-op
    }
  });

  describe('register', () => {
    it(`registers a new service worker`, async function () {
      const result = await executeAsyncAndCatch(async (cb) => {
        try {
          const wb = new Workbox('sw-clients-claim.js.njk');
          await wb.register();

          const reg = await navigator.serviceWorker.getRegistration();
          const sw = reg.installing || reg.waiting || reg.active;

          cb({scriptURL: sw.scriptURL});
        } catch (error) {
          cb({error: error.stack});
        }
      });

      expect(result.scriptURL).to.equal(`${testPath}sw-clients-claim.js.njk`);
    });

    it(`reports all events for a new SW registration`, async function () {
      const result = await executeAsyncAndCatch(async (cb) => {
        try {
          const wb = new Workbox('sw-clients-claim.js.njk');

          const installedSpy = sinon.spy();
          const waitingSpy = sinon.spy();
          const activatedSpy = sinon.spy();
          const controllingSpy = sinon.spy();

          wb.addEventListener('installed', installedSpy);
          wb.addEventListener('waiting', waitingSpy);
          wb.addEventListener('activated', activatedSpy);
          wb.addEventListener('controlling', controllingSpy);

          await wb.register();

          await window.activatedAndControlling(wb);
          cb({
            isUpdate: installedSpy.args[0][0].isUpdate,
            installedSpyCallCount: installedSpy.callCount,
            waitingSpyCallCount: waitingSpy.callCount,
            controllingSpyCallCount: controllingSpy.callCount,
            controllingIsExternal: controllingSpy.args[0][0].isExternal,
            activatedSpyCallCount: activatedSpy.callCount,
          });
        } catch (error) {
          cb({error: error.stack});
        }
      });

      // Test for truthiness because some browsers structure clone
      // `undefined` to `null`.
      expect(result.isUpdate).to.not.be.ok;
      expect(result.controllingIsExternal).to.not.be.ok;
      expect(result.installedSpyCallCount).to.equal(1);
      expect(result.activatedSpyCallCount).to.equal(1);
      expect(result.controllingSpyCallCount).to.equal(1);

      //  A new installation shouldn't enter the waiting phase.
      expect(result.waitingSpyCallCount).to.equal(0);
    });

    it(`reports all events for an updated SW registration`, async function () {
      const result = await executeAsyncAndCatch(async (cb) => {
        try {
          const wb1 = new Workbox('sw-clients-claim.js.njk?v=1');
          const redundantSpy = sinon.spy();
          const wb1ControllingSpy = sinon.spy();
          wb1.addEventListener('redundant', redundantSpy);
          wb1.addEventListener('controlling', wb1ControllingSpy);

          await wb1.register();
          await window.activatedAndControlling(wb1);

          const wb2 = new Workbox('sw-clients-claim.js.njk?v=2');

          const installedSpy = sinon.spy();
          const waitingSpy = sinon.spy();
          const activatedSpy = sinon.spy();
          const wb2ControllingSpy = sinon.spy();

          wb2.addEventListener('installed', installedSpy);
          wb2.addEventListener('waiting', waitingSpy);
          wb2.addEventListener('activated', activatedSpy);
          wb2.addEventListener('controlling', wb2ControllingSpy);

          await wb2.register();

          // Once the newly updated SW is in control, report back.
          await window.activatedAndControlling(wb2);
          cb({
            wb1IsUpdate: redundantSpy.args[0][0].isUpdate,
            wb2IsUpdate: installedSpy.args[0][0].isUpdate,
            wb1ControllingIsExternal: wb1ControllingSpy.args[0][0].isExternal,
            wb2ControllingIsExternal: wb2ControllingSpy.args[0][0].isExternal,
            installedSpyCallCount: installedSpy.callCount,
            waitingSpyCallCount: waitingSpy.callCount,
            controllingSpyCallCount: wb2ControllingSpy.callCount,
            activatedSpyCallCount: activatedSpy.callCount,
          });
        } catch (error) {
          cb({error: error.stack});
        }
      });

      // Test for truthiness because some browsers structure clone
      // `undefined` to `null`.
      expect(result.wb1IsUpdate).to.not.be.ok;
      expect(result.wb2IsUpdate).to.equal(true);
      expect(result.wb1ControllingIsExternal).to.not.be.ok;
      expect(result.wb2ControllingIsExternal).to.not.be.ok;
      expect(result.installedSpyCallCount).to.equal(1);
      expect(result.waitingSpyCallCount).to.equal(0);
      expect(result.activatedSpyCallCount).to.equal(1);
      expect(result.controllingSpyCallCount).to.equal(1);
    });

    it(`reports all events for an external SW registration`, async function () {
      const iframeManager = new IframeManager(webdriver);

      await executeAsyncAndCatch(async (cb) => {
        try {
          const wb = new Workbox('sw-clients-claim.js.njk');

          // Use a global variable so these are accessible to future
          // `executeAsyncAndCatch()` calls.
          self.__spies = {
            installedSpy: sinon.spy(),
            waitingSpy: sinon.spy(),
            activatedSpy: sinon.spy(),
            controllingSpy: sinon.spy(),
          };

          wb.addEventListener('installed', self.__spies.installedSpy);
          wb.addEventListener('waiting', self.__spies.waitingSpy);
          wb.addEventListener('activated', self.__spies.activatedSpy);
          wb.addEventListener('controlling', self.__spies.controllingSpy);

          await wb.register();

          // Resolve this execution block once the SW is in control.
          await window.activatedAndControlling(wb);
          cb();
        } catch (error) {
          cb({error: error.stack});
        }
      });

      // Update the version in sw.js to trigger a new installation.
      templateData.assign({version: '2'});

      const secondPath = `${testPath}?second`;
      const iframeClient = await iframeManager.createIframeClient(secondPath);
      const location = await iframeClient.executeAsyncScript(`
        const wb = new Workbox('sw-clients-claim.js.njk');
        wb.register()
          .then(() => window.activatedAndControlling(wb))
          .then(() => location.href);
      `);

      // Just confirm we're operating on the page we expect.
      expect(location).to.eql(secondPath);

      const result = await executeAsyncAndCatch(async (cb) => {
        cb({
          location: location.href,
          installedSpyArgs: JSON.stringify(self.__spies.installedSpy.args),
          waitingSpyArgs: JSON.stringify(self.__spies.waitingSpy.args),
          activatedSpyArgs: JSON.stringify(self.__spies.activatedSpy.args),
          controllingSpyArgs: JSON.stringify(self.__spies.controllingSpy.args),
        });
      });

      const installedSpyArgs = JSON.parse(result.installedSpyArgs);
      const waitingSpyArgs = JSON.parse(result.waitingSpyArgs);
      const activatedSpyArgs = JSON.parse(result.activatedSpyArgs);
      const controllingSpyArgs = JSON.parse(result.controllingSpyArgs);

      // Just confirm we're operating on the page we expect.
      expect(result.location).to.eql(testPath);

      expect(installedSpyArgs.length, 'installedSpy').to.eql(2);
      expect(waitingSpyArgs.length, 'waitingSpy').to.eql(0);
      expect(activatedSpyArgs.length, 'activatedSpy').to.eql(2);
      expect(controllingSpyArgs.length, 'controllingSpy').to.eql(2);

      expect(installedSpyArgs[0][0].isExternal).to.eql(false);
      expect(activatedSpyArgs[0][0].isExternal).to.eql(false);
      expect(controllingSpyArgs[0][0].isExternal).to.eql(false);
      expect(installedSpyArgs[1][0].isExternal).to.eql(true);
      expect(activatedSpyArgs[1][0].isExternal).to.eql(true);
      expect(controllingSpyArgs[1][0].isExternal).to.eql(true);
    });
  });
});
