/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/


const {expect} = require('chai');
const templateData = require('../../../infra/testing/server/template-data');
const waitUntil = require('../../../infra/testing/wait-until');
const {executeAsyncAndCatch} = require('../../../infra/testing/webdriver/executeAsyncAndCatch');
const {getLastWindowHandle} = require('../../../infra/testing/webdriver/getLastWindowHandle');
const {openNewTab} = require('../../../infra/testing/webdriver/openNewTab');
const {unregisterAllSWs} = require('../../../infra/testing/webdriver/unregisterAllSWs');
const {windowLoaded} = require('../../../infra/testing/webdriver/windowLoaded');

// Store local references of these globals.
const {webdriver, server} = global.__workbox;

const testServerOrigin = server.getAddress();
const testPath = `${testServerOrigin}/test/workbox-window/static/`;
const unitTestPath = `${testServerOrigin}/test/workbox-window/unit/`;

describe(`[workbox-window]`, function() {
  it(`passes all unit tests`, async function() {
    // Don't retry failed unit tests.
    this.retries(0);

    await webdriver.get(unitTestPath);

    // In dev mode, stub the environment variables.
    if (process.env.NODE_ENV !== 'production') {
      await webdriver.executeScript(() => {
        self.process = {env: {NODE_ENV: 'dev'}};
        console.info(self.process);
      });
    }

    // Wait until the mocha tests are finished.
    await waitUntil(async () => {
      return await webdriver.executeScript(() => self.mochaResults);
    }, 120, 500); // Retry for 60 seconds.

    const results = await webdriver.executeScript(() => self.mochaResults);

    if (results.failures > 0) {
      console.log(`\n${results.failures} test failure(s):`);

      for (const report of results.reports) {
        console.log('');
        console.log('Name     : ', report.name);
        console.log('Message  : ', report.message);
        console.log('Error    : ', report.stack);
      }
      console.log('');

      throw new Error('Unit tests failed, see logs above for details');
    }
  });
});

describe(`[workbox-window] Workbox`, function() {
  beforeEach(async function() {
    templateData.assign({version: '1'});
    await webdriver.get(testPath);
    await windowLoaded();
  });

  afterEach(async function() {
    await unregisterAllSWs();
  });

  describe('register', () => {
    it(`registers a new service worker`, async function() {
      const result = await executeAsyncAndCatch(async (cb) => {
        try {
          const wb = new Workbox({scriptURL: 'sw-clients-claim.tmp.js'});
          await wb.register();

          const reg = await navigator.serviceWorker.getRegistration();
          const sw = reg.installing || reg.waiting || reg.active;

          cb({scriptURL: sw.scriptURL});
        } catch (error) {
          cb({error: error.stack});
        }
      });

      expect(result.scriptURL).to.equal(`${testPath}sw-clients-claim.tmp.js`);
    });

    it(`reports all events for a new SW registration`, async function() {
      const result = await executeAsyncAndCatch(async (cb) => {
        try {
          const wb = new Workbox({scriptURL: 'sw-clients-claim.tmp.js'});
          await wb.register();

          const installedSpy = sinon.spy();
          const waitingSpy = sinon.spy();
          const activatedSpy = sinon.spy();
          const controllingSpy = sinon.spy();

          wb.addEventListener('installed', installedSpy);
          wb.addEventListener('waiting', waitingSpy);
          wb.addEventListener('controlling', controllingSpy);
          wb.addEventListener('activated', activatedSpy);

          wb.addEventListener('activated', () => {
            cb({
              installedSpyCallCount: installedSpy.callCount,
              waitingSpyCallCount: waitingSpy.callCount,
              controllingSpyCallCount: controllingSpy.callCount,
              activatedSpyCallCount: activatedSpy.callCount,
            });
          });
        } catch (error) {
          cb({error: error.stack});
        }
      });

      expect(result.installedSpyCallCount).to.equal(1);
      expect(result.activatedSpyCallCount).to.equal(1);
      expect(result.controllingSpyCallCount).to.equal(1);

      //  A new installation shouldn't enter the waiting phase.
      expect(result.waitingSpyCallCount).to.equal(0);
    });

    it(`reports all events for an external SW registration`, async function() {
      const firstTab = await getLastWindowHandle();

      await executeAsyncAndCatch(async (cb) => {
        try {
          const wb = new Workbox({scriptURL: 'sw-clients-claim.tmp.js'});
          await wb.register();

          // Use a global variable so these are accessible to future
          // `executeAsyncAndCatch()` calls.
          self.__spies = {
            installedSpy: sinon.spy(),
            waitingSpy: sinon.spy(),
            activatedSpy: sinon.spy(),
            controllingSpy: sinon.spy(),
            externalInstalledSpy: sinon.spy(),
            externalActivatedSpy: sinon.spy(),
          };

          wb.addEventListener('installed', self.__spies.installedSpy);
          wb.addEventListener('waiting', self.__spies.waitingSpy);
          wb.addEventListener('controlling', self.__spies.controllingSpy);
          wb.addEventListener('activated', self.__spies.activatedSpy);
          wb.addEventListener('externalinstalled', self.__spies.externalInstalledSpy);
          wb.addEventListener('externalactivated', self.__spies.externalActivatedSpy);

          // Resolve this execution block once the SW is activated.
          wb.addEventListener('activated', () => cb());
        } catch (error) {
          cb({error: error.stack});
        }
      });

      // Update the version in sw.js to trigger a new installation.
      templateData.assign({version: '2'});

      await openNewTab(testPath);
      await windowLoaded();

      await executeAsyncAndCatch(async (cb) => {
        try {
          const wb = new Workbox({scriptURL: 'sw-clients-claim.tmp.js'});
          await wb.register();

          // Resolve this execution block once the SW has activated.
          wb.addEventListener('activated', () => cb());
        } catch (error) {
          cb({error: error.stack});
        }
      });

      // Close the second tab and switch back to the first tab before
      // executing the following block.
      await webdriver.close();
      await webdriver.switchTo().window(firstTab);

      const result = await executeAsyncAndCatch(async (cb) => {
        try {
          cb({
            installedSpyCallCount: self.__spies.installedSpy.callCount,
            waitingSpyCallCount: self.__spies.waitingSpy.callCount,
            activatedSpyCallCount: self.__spies.activatedSpy.callCount,
            controllingSpyCallCount: self.__spies.controllingSpy.callCount,
            externalInstalledSpyCallCount: self.__spies.externalInstalledSpy.callCount,
            externalActivatedSpyCallCount: self.__spies.externalActivatedSpy.callCount,
          });
        } catch (error) {
          cb({error: error.stack});
        }
      });

      expect(result.installedSpyCallCount).to.equal(1);
      expect(result.activatedSpyCallCount).to.equal(1);
      expect(result.controllingSpyCallCount).to.equal(1);
      expect(result.externalInstalledSpyCallCount).to.equal(1);
      expect(result.externalActivatedSpyCallCount).to.equal(1);

      // The waiting phase should have been skipped.
      expect(result.waitingSpyCallCount).to.equal(0);
    });

    it(`notifies a controlling SW that the window is ready`, async function() {
      // Register a SW and wait until it's controlling the page since
      // ready messages are only sent to controlling SWs with matching URLs.
      await executeAsyncAndCatch(async (cb) => {
        try {
          const wb = new Workbox({scriptURL: 'sw-window-ready.js'});
          await wb.register();

          wb.addEventListener('controlling', () => cb());
        } catch (error) {
          cb({error: error.stack});
        }
      });

      const result = await executeAsyncAndCatch(async (cb) => {
        try {
          const readyMessageReceived = new Promise((resolve) => {
            navigator.serviceWorker.addEventListener('message', (event) => {
              if (event.data.type === 'sw:message:ready') {
                resolve();
              }
            });
          });

          const wb = new Workbox({scriptURL: 'sw-window-ready.js'});
          wb.register();

          await readyMessageReceived;
          cb(true);
        } catch (error) {
          cb({error: error.stack});
        }
      });

      expect(result).to.equal(true);
    });
  });
});
