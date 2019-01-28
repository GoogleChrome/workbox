/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/


import {Workbox} from '/__WORKBOX/buildFile/workbox-window';

const isDev = () => {
  return self.process && self.process.env &&
      self.process.env.NODE_ENV !== 'production';
};

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const waitUntil = async (condition, timeout = 2000) => {
  const startTime = performance.now();
  while (!condition()) {
    if (performance.now() > startTime + timeout) {
      const error = new Error(`Timed out after ${timeout}ms.`);
      console.error(error);
      throw error;
    }
    await sleep(100);
  }
};

const nextEvent = (obj, eventType) => {
  return new Promise((resolve) => obj.addEventListener(eventType, resolve));
};

const uniq = (() => {
  let timestamp = Date.now();
  let uid = 0;
  return (scriptURL) => {
    const url = new URL(scriptURL, location);
    url.searchParams.set('_id', `${++uid}-${timestamp}`);

    return url.toString();
  };
})();


const stubAlreadyControllingSW = async (scriptURL) => {
  await navigator.serviceWorker.register(scriptURL);
  await waitUntil(() => {
    return navigator.serviceWorker.controller &&
        navigator.serviceWorker.controller.scriptURL.endsWith(scriptURL);
  });
};

const updateVersion = async (version, scriptURL) => {
  // Dynamically update the version string in the SW script.
  await fetch(`/__WORKBOX/updateTemplate`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({version}),
  });

  // If a script URL is passed, wait until a request for that script returns
  // the newly set version.
  let tries = 0;
  if (scriptURL) {
    while (++tries < 10) {
      const resp = await fetch(scriptURL);
      const text = await resp.text();
      if (text.indexOf(version) > -1) {
        return;
      } else {
        await sleep(100);
      }
    }
  }
  throw new Error('No updated version found after 10 retries');
};

const sandbox = sinon.createSandbox();

describe(`[workbox-window] Workbox`, function() {
  // Since it's not possible to completely unregister a controlling SW from
  // a page (without closing all clients, including the current window), it's
  // also not possible to run unit tests all from a fresh start in a single
  // page load.
  // Thus, to make these tests as predictable as possible, we start all unit
  // tests with a controlling SW and only test the things that don't need to
  // assert fresh-install behavior. Anything that does must be tested with
  // integration tests.
  beforeEach(async function() {
    const scriptURL = uniq('sw-clients-claim.tmp.js');
    await updateVersion('1.0.0', scriptURL);
    await stubAlreadyControllingSW(scriptURL);

    sandbox.restore();
    sandbox.spy(console, 'debug');
    sandbox.spy(console, 'log');
    sandbox.spy(console, 'warn');
    sandbox.spy(console, 'error');
  });

  after(async function() {
    sandbox.restore();
  });

  describe(`constructor`, function() {
    it(`creates an instance of the Workbox class`, async function() {
      const wb = new Workbox(uniq('sw-clients-claim.tmp.js'));
      expect(wb).to.be.instanceOf(Workbox);
    });

    it(`does not register a SW`, function(done) {
      sandbox.spy(navigator.serviceWorker, 'register');

      new Workbox(uniq('sw-clients-claim.tmp.js'));

      // Queue a task to ensure a SW isn't registered async.
      setTimeout(() => {
        // Not calling addEventListener means Workbox properly detected that
        // the window was already loaded
        expect(navigator.serviceWorker.register.callCount).to.equal(0);
        done();
      }, 0);
    });
  });

  describe(`register`, function() {
    it(`registers a service worker if the window is loaded`, async function() {
      sandbox.spy(navigator.serviceWorker, 'register');
      sandbox.spy(self, 'addEventListener');

      const scriptURL = uniq('sw-no-skip-waiting.tmp.js');
      const wb = new Workbox({scriptURL});
      await wb.register();

      // Not calling addEventListener means Workbox properly detected that
      // the window was already loaded
      expect(self.addEventListener.calledWith('load')).to.not.equal(true);
      expect(navigator.serviceWorker.register.callCount).to.equal(1);
      expect(navigator.serviceWorker.register.args[0][0]).to.equal(scriptURL);
    });

    it(`defers registration until after load by default`, async function() {
      sandbox.spy(navigator.serviceWorker, 'register');
      sandbox.spy(self, 'addEventListener');

      // Stub the window not yet being loaded
      sandbox.stub(document, 'readyState').value('loading');

      // Trigger the load event in the next task.
      setTimeout(() => self.dispatchEvent(new Event('load'), 0));

      const wb = new Workbox({scriptURL: uniq('sw-no-skip-waiting.tmp.js')});
      await wb.register();

      expect(self.addEventListener.calledWith('load')).to.equal(true);
      expect(self.addEventListener.args[0][0]).to.equal('load');
    });

    it(`supports not deferring until load`, async function() {
      sandbox.spy(navigator.serviceWorker, 'register');
      sandbox.spy(self, 'addEventListener');

      // Stub the window not yet being loaded
      sandbox.stub(document, 'readyState').value('loading');

      // Trigger the load event in the next task.
      setTimeout(() => self.dispatchEvent(new Event('load'), 0));

      const wb = new Workbox({scriptURL: uniq('sw-no-skip-waiting.tmp.js')});
      await wb.register({immediate: true});

      expect(self.addEventListener.calledWith('load')).to.not.equal(true);
    });

    it(`errors when registration fails`, async function() {
      const wb = new Workbox({scriptURL: uniq('sw-error.js')});

      try {
        await wb.register();
        // We shouldn't get here because the above line should fail.
        throw new Error('unexpected');
      } catch (error) {
        expect(error.name).to.equal('TypeError');
        expect(error.message).not.to.match(/unexpected/i);
      }
    });

    it(`notifies the SW that the window is ready if the registered SW is already controlling the page`, async function() {
      // Gets the URL of the currently controlling SW.
      const controllingSW = navigator.serviceWorker.controller;
      const {scriptURL} = controllingSW;
      sandbox.stub(controllingSW, 'postMessage');

      await new Workbox({scriptURL}).register();

      expect(controllingSW.postMessage.callCount).to.equal(1);
      expect(controllingSW.postMessage.args[0][0]).to.deep.equal({
        type: 'WINDOW_READY',
        meta: 'workbox-window',
      });

      // Test that no message is sent if the SW wasn't already controlling the
      // page at registration time.
      await new Workbox({scriptURL: scriptURL + '&nocache'}).register();
      expect(controllingSW.postMessage.callCount).to.equal(1);
    });

    describe(`logs in development-only`, function() {
      it(`(debug) if a SW with the same script URL is already controlling the page`, async function() {
        if (!isDev()) this.skip();

        // Gets the URL of the currently controlling SW.
        const {scriptURL} = navigator.serviceWorker.controller;

        const wb = new Workbox({scriptURL});
        await wb.register();

        expect(console.debug.callCount).to.equal(1);
        expect(console.debug.args[0][2]).to.match(/same/i);
      });

      it(`(debug) if a SW with a different script URL is already controlling the page`, async function() {
        if (!isDev()) this.skip();

        const wb = new Workbox({scriptURL: uniq('sw-no-skip-waiting.tmp.js')});
        await wb.register();

        expect(console.debug.callCount).to.equal(1);
        expect(console.debug.args[0][2]).to.match(/different/i);
        expect(console.debug.args[0][2]).to.match(/new/i);
      });

      it(`(info) when registration is successful`, async function() {
        if (!isDev()) this.skip();

        sandbox.spy(navigator.serviceWorker, 'register');

        const wb = new Workbox({scriptURL: uniq('sw-no-skip-waiting.tmp.js')});
        await wb.register();

        expect(console.log.callCount).to.equal(1);
        expect(console.log.args[0][2]).to.match(/success/i);
      });

      it(`(warn) when the registered SW is not in scope for the current page`, async function() {
        if (!isDev()) this.skip();

        sandbox.spy(navigator.serviceWorker, 'register');

        const wb = new Workbox({scriptURL: uniq('/out-of-scope/sw-clients-claim.tmp.js')});
        await wb.register();

        expect(console.warn.callCount).to.equal(1);
        expect(console.warn.args[0][2]).to.include('scope');
      });

      it(`(warn) when a service worker is installed but now waiting`, async function() {
        if (!isDev()) this.skip();

        const wb = new Workbox({scriptURL: uniq('sw-no-skip-waiting.tmp.js')});
        await wb.register();

        await waitUntil(() => console.warn.callCount === 1);
        expect(console.warn.args[0][2]).to.match(/waiting/i);
      });

      it(`(error) when registration fails`, async function() {
        if (!isDev()) this.skip();

        const wb = new Workbox({scriptURL: uniq('sw-error.js')});

        try {
          await wb.register();
          // We shouldn't get here because the above line should fail.
          throw new Error('unexpected');
        } catch (error) {
          expect(error.name).to.equal('TypeError');
          expect(console.error.callCount).to.equal(1);
          expect(console.error.args[0][2].message).to.equal(error.message);
        }
      });

      it(`(error) if calling register twice`, async function() {
        if (!isDev()) this.skip();

        const wb = new Workbox({scriptURL: uniq('sw-clients-claim.tmp.js')});
        await wb.register();
        await nextEvent(wb, 'controlling');

        await wb.register();
        expect(console.error.callCount).to.equal(1);
        expect(console.error.args[0][2]).to.match(/cannot re-register/i);
      });
    });
  });

  describe(`active`, function() {
    it(`resolves as soon as the registered SW is active`, async function() {
      const controllerBeforeTest = navigator.serviceWorker.controller;
      const scriptURL = controllerBeforeTest.scriptURL;
      const wb = new Workbox({scriptURL});

      // Registering using the same script URL that's already active won't
      // trigger an update.
      const reg = await wb.register();
      const sw = await wb.active;

      expect(sw).to.equal(reg.active);
      expect(sw).to.equal(controllerBeforeTest);
    });

    it(`waits for an update if the scriptURLs don't match`, async function() {
      const controllerBeforeTest = navigator.serviceWorker.controller;
      const scriptURL = uniq('sw-clients-claim.tmp.js');
      const wb = new Workbox({scriptURL});

      // Registering using a different script URL should trigger an update,
      // and `.active` shouldn't resolve until after the update.
      const reg = await wb.register();
      const sw = await wb.active;

      expect(sw).to.equal(reg.active);
      expect(sw).to.not.equal(controllerBeforeTest);
    });

    it(`waits for an update if the script versions don't match`, async function() {
      // Register a service worker that will respond to version messages.
      const scriptURL = uniq('sw-script-version.tmp.js');
      await stubAlreadyControllingSW(scriptURL);

      // Get a reference to the controller before the new SW is registered.
      const controllerBeforeTest = navigator.serviceWorker.controller;

      // Update the version of the file on the server, but keep the same URL.
      await updateVersion('2.0.0', scriptURL);

      const wb = new Workbox({
        scriptURL,
        scriptVersion: '2.0.0',
        registerOptions: {
          // Ensure the dynamic change is ignored due to caching...
          updateViaCache: 'none',
        },
      });

      // Registering using a version that doesn't match the version of the
      // currently active service worker should make `.active` wait until an
      // update is found before resolving.
      const reg = await wb.register();
      const sw = await wb.active;

      expect(sw).to.equal(reg.active);
      expect(sw).to.not.equal(controllerBeforeTest);
    });

    it(`handles cases where the controlling SW doesn't respond to a version request message`, async function() {
      // Get a reference to the controller before the new SW is registered.
      const controllerBeforeTest = navigator.serviceWorker.controller;
      const {scriptURL} = controllerBeforeTest;
      await updateVersion('2.0.0', scriptURL);

      const wb = new Workbox({
        scriptURL,
        scriptVersion: '2.0.0',
        registerOptions: {
          // Ensure the dynamic change is ignored due to caching...
          updateViaCache: 'none',
        },
      });

      // Registration should trigger an update and a version check, but since
      // this SW doesn't have message listeners to respond to the version
      // check, it should time out instead.
      const reg = await wb.register();
      const sw = await wb.active;

      expect(sw).to.equal(reg.active);
      expect(sw).to.not.equal(controllerBeforeTest);
    });
  });

  describe(`controlling`, function() {
    it(`resolves as soon as the registered SW is controlling`, async function() {
      const controllerBeforeTest = navigator.serviceWorker.controller;
      const scriptURL = controllerBeforeTest.scriptURL;
      const wb = new Workbox({scriptURL});

      // Registering using the same script URL that's already controlling
      // won't trigger an update.
      await wb.register();
      const sw = await wb.controlling;

      expect(sw).to.equal(navigator.serviceWorker.controller);
      expect(sw).to.equal(controllerBeforeTest);
    });

    it(`waits for an update if the scriptURLs don't match`, async function() {
      const controllerBeforeTest = navigator.serviceWorker.controller;
      const scriptURL = uniq('sw-clients-claim.tmp.js');
      const wb = new Workbox({scriptURL});

      // Registering using a different script URL should trigger an update,
      // and `.controlling` shouldn't resolve until after the update.
      await wb.register();
      const sw = await wb.controlling;

      expect(sw).to.equal(navigator.serviceWorker.controller);
      expect(sw).to.not.equal(controllerBeforeTest);
    });

    it(`waits for an update if the script versions don't match`, async function() {
      // Register a service worker that will respond to version messages.
      const scriptURL = uniq('sw-script-version.tmp.js');
      await stubAlreadyControllingSW(scriptURL);

      // Get a reference to the controller before the new SW is registered.
      const controllerBeforeTest = navigator.serviceWorker.controller;

      // Update the version of the file on the server, but keep the same URL.
      await updateVersion('2.0.0', scriptURL);

      const wb = new Workbox({
        scriptURL,
        scriptVersion: '2.0.0',
        registerOptions: {
          // Ensure the dynamic change is ignored due to caching...
          updateViaCache: 'none',
        },
      });

      // Registering using a version that doesn't match the version of the
      // currently controlling service worker should make `.controlling` wait
      // until an update is found before resolving.
      await wb.register();
      const sw = await wb.controlling;

      expect(sw).to.equal(navigator.serviceWorker.controller);
      expect(sw).to.not.equal(controllerBeforeTest);
    });

    it(`handles cases where the controlling SW doesn't respond to a version request message`, async function() {
      // Get a reference to the controller before the new SW is registered.
      const controllerBeforeTest = navigator.serviceWorker.controller;
      const {scriptURL} = controllerBeforeTest;
      await updateVersion('2.0.0', scriptURL);

      const wb = new Workbox({
        scriptURL,
        scriptVersion: '2.0.0',
        registerOptions: {
          // Ensure the dynamic change is ignored due to caching...
          updateViaCache: 'none',
        },
      });

      // Registration should trigger an update and a version check, but since
      // this SW doesn't have message listeners to respond to the version
      // check, it should time out instead.
      await wb.register();
      const sw = await wb.controlling;

      expect(sw).to.equal(navigator.serviceWorker.controller);
      expect(sw).to.not.equal(controllerBeforeTest);
    });
  });

  describe(`getSW`, function() {
    it(`resolves as soon as it has a reference to the SW registered by this instance`, async function() {
      const wb = new Workbox({
        scriptURL: uniq('sw-skip-waiting-deferred.tmp.js'),
      });

      // Intentionally do not await `register()`, so we can test that
      // `getSW()` does in its implementation.
      wb.register();

      const reg = await navigator.serviceWorker.getRegistration();
      const sw = await wb.getSW();

      // This SW defers calling skip waiting, so our SW should match the
      // installing service worker.
      expect(sw).to.equal(reg.installing);
    });

    it(`resolves before updating if a SW with the same script URL is already active`, async function() {
      const scriptURL = navigator.serviceWorker.controller.scriptURL;
      const wb = new Workbox({scriptURL});

      // Registering using the same script URL that's already active won't
      // trigger an update.
      wb.register();

      const sw = await wb.getSW();
      expect(sw).to.equal(navigator.serviceWorker.controller);
    });

    it(`resolves as soon as an an update is found (if no active SW exists)`, async function() {
      const wb = new Workbox({scriptURL: uniq('sw-clients-claim.tmp.js')});
      wb.register();

      const sw = await wb.getSW();
      expect(sw.state).to.equal('installing');
    });
  });

  describe(`messageSW`, function() {
    it(`postMessages the registered service worker`, async function() {
      const wb = new Workbox({scriptURL: uniq('sw-message-reply.js')});
      await wb.register();

      const messageSpy = sandbox.spy();
      navigator.serviceWorker.addEventListener('message', messageSpy);

      wb.messageSW({type: 'POST_MESSAGE_BACK'});
      await waitUntil(() => messageSpy.called);

      expect(messageSpy.args[0][0].data).to.equal('postMessage from SW!');
    });

    it(`returns a promise that resolves with the SW's response (if any)`, async function() {
      const wb = new Workbox({scriptURL: uniq('sw-message-reply.js')});
      wb.register();

      const response = await wb.messageSW({type: 'RESPOND_TO_MESSAGE'});
      expect(response).to.equal('Reply from SW!');
    });

    it(`awaits registration if registration hasn't run`, async function() {
      const wb = new Workbox({scriptURL: uniq('sw-message-reply.js')});
      setTimeout(() => wb.register(), 100);

      const response = await wb.messageSW({type: 'RESPOND_TO_MESSAGE'});
      expect(response).to.equal('Reply from SW!');
    });
  });

  describe(`events`, function() {
    describe(`message`, function() {
      it(`fires when a postMessage is received from the SW`, async function() {
        const wb = new Workbox({scriptURL: uniq('sw-message-reply.js')});
        await wb.register();
        await wb.getSW();

        const messageSpy = sandbox.spy();
        wb.addEventListener('message', messageSpy);

        wb.messageSW({type: 'POST_MESSAGE_BACK'});
        await nextEvent(wb, 'message');

        expect(messageSpy.args[0][0]).to.equal('postMessage from SW!');
      });

      it(`fires when a BroadcastChannel message for the workbox tag is received`, async function() {
        if (!('BroadcastChannel' in self)) this.skip();

        const wb = new Workbox({scriptURL: uniq('sw-message-reply.js')});
        await wb.register();
        await wb.getSW();

        const messageSpy = sandbox.spy();
        wb.addEventListener('message', messageSpy);

        wb.messageSW({type: 'BROADCAST_BACK'});
        await nextEvent(wb, 'message');

        expect(messageSpy.args[0][0]).to.equal('BroadcastChannel from SW!');
      });
    });

    describe(`installed`, function() {
      it(`fires the first time the registered SW is installed`, async function() {
        const scriptURL = uniq('sw-clients-claim.tmp.js');

        const wb1 = new Workbox({scriptURL});
        const installed1Spy = sandbox.spy();
        wb1.addEventListener('installed', installed1Spy);
        await wb1.register();
        await nextEvent(wb1, 'installed');

        // Create a second instance for the same SW script so it won't be
        // installed this time.
        const wb2 = new Workbox({scriptURL});
        const installed2Spy = sandbox.spy();
        wb2.addEventListener('installed', installed2Spy);
        await wb2.register();

        // Create a third instace for a different stip to assert the callback
        // runs again, but only for own instances.
        const wb3 = new Workbox({scriptURL: uniq('sw-clients-claim.tmp.js')});
        const installed3Spy = sandbox.spy();
        wb3.addEventListener('installed', installed3Spy);
        await wb3.register();
        await nextEvent(wb3, 'installed');

        expect(installed1Spy.callCount).to.equal(1);
        expect(installed1Spy.args[0][0]).to.equal(await wb1.getSW());

        expect(installed2Spy.callCount).to.equal(0);

        expect(installed3Spy.callCount).to.equal(1);
        expect(installed3Spy.args[0][0]).to.equal(await wb3.getSW());
      });
    });

    describe(`waiting`, function() {
      it(`runs if the registered service worker is waiting`, async function() {
        const wb1 = new Workbox({scriptURL: uniq('sw-no-skip-waiting.tmp.js')});
        const waiting1Spy = sandbox.spy();
        wb1.addEventListener('waiting', waiting1Spy);

        const wb2 = new Workbox({scriptURL: uniq('sw-clients-claim.tmp.js')});
        const waiting2Spy = sandbox.spy();
        wb2.addEventListener('waiting', waiting2Spy);

        const wb3 = new Workbox({scriptURL: uniq('sw-no-skip-waiting.tmp.js')});
        const waiting3Spy = sandbox.spy();
        wb3.addEventListener('waiting', waiting3Spy);

        await wb1.register();
        await nextEvent(wb1, 'waiting');
        await wb2.register();
        await wb3.register();
        await nextEvent(wb3, 'waiting');

        expect(waiting1Spy.callCount).to.equal(1);
        expect(waiting1Spy.args[0][0]).to.equal(await wb1.getSW());

        expect(waiting2Spy.callCount).to.equal(0);

        expect(waiting3Spy.callCount).to.equal(1);
        expect(waiting3Spy.args[0][0]).to.equal(await wb3.getSW());
      });
    });

    describe(`activated`, function() {
      it(`runs the first time the registered SW is activated`, async function() {
        const wb1 = new Workbox({scriptURL: uniq('sw-clients-claim.tmp.js')});
        const activated1Spy = sandbox.spy();
        wb1.addEventListener('activated', activated1Spy);
        await wb1.register();
        await nextEvent(wb1, 'activated');

        const wb2 = new Workbox({scriptURL: uniq('sw-no-skip-waiting.tmp.js')});
        const activated2Spy = sandbox.spy();
        wb2.addEventListener('activated', activated2Spy);
        await wb2.register();

        const wb3 = new Workbox({scriptURL: uniq('sw-clients-claim.tmp.js')});
        const activated3Spy = sandbox.spy();
        wb3.addEventListener('activated', activated3Spy);
        await wb3.register();
        await nextEvent(wb3, 'activated');

        expect(activated1Spy.callCount).to.equal(1);
        expect(activated1Spy.args[0][0]).to.equal(await wb1.getSW());

        expect(activated2Spy.callCount).to.equal(0);

        expect(activated3Spy.callCount).to.equal(1);
        expect(activated3Spy.args[0][0]).to.equal(await wb3.getSW());
      });
    });

    describe(`controlling`, function() {
      it(`runs when the registered SW is first controlling`, async function() {
        const wb1 = new Workbox({scriptURL: uniq('sw-clients-claim.tmp.js')});
        const controlling1Spy = sandbox.spy();
        wb1.addEventListener('controlling', controlling1Spy);
        await wb1.register();
        await nextEvent(wb1, 'controlling');

        const wb2 = new Workbox({scriptURL: uniq('sw-no-skip-waiting.tmp.js')});
        const controlling2Spy = sandbox.spy();
        wb2.addEventListener('controlling', controlling2Spy);
        await wb2.register();

        const wb3 = new Workbox({scriptURL: uniq('sw-clients-claim.tmp.js')});
        const controlling3Spy = sandbox.spy();
        wb3.addEventListener('controlling', controlling3Spy);
        await wb3.register();
        await nextEvent(wb3, 'controlling');

        expect(controlling1Spy.callCount).to.equal(1);
        expect(controlling1Spy.args[0][0]).to.equal(await wb1.getSW());

        expect(controlling2Spy.callCount).to.equal(0);

        expect(controlling3Spy.callCount).to.equal(1);
        expect(controlling3Spy.args[0][0]).to.equal(await wb3.getSW());
      });

      it(`doesn't run in cases where the SW is active but not controlling (first install)`, async function() {
        // Stub no controller, which simulates what would happen the first
        // time a SW is installed.
        // TODO(philipwalton): we'll also need to stub the `controllerchange`
        // event if we add that to the library.
        Object.defineProperty(navigator.serviceWorker, 'controller', {
          configurable: true,
          value: undefined,
        });

        const wb = new Workbox({scriptURL: uniq('sw-skip-waiting.tmp.js')});

        const activatedSpy = sandbox.spy();
        wb.addEventListener('activated', activatedSpy);
        const controllingSpy = sandbox.spy();
        wb.addEventListener('controlling', controllingSpy);

        await wb.register();
        await nextEvent(wb, 'activated');

        expect(activatedSpy.callCount).to.equal(1);
        expect(activatedSpy.args[0][0]).to.equal(await wb.getSW());

        expect(controllingSpy.callCount).to.equal(0);

        // Restore `navigator.serviceWorker.controller`.
        delete navigator.serviceWorker.controller;
      });
    });

    describe(`externalinstalled`, function() {
      it(`runs when an external SW is found and installed`, async function() {
        const wb1 = new Workbox({scriptURL: uniq('sw-clients-claim.tmp.js')});
        const externalInstalled1Spy = sandbox.spy();
        wb1.addEventListener('externalinstalled', externalInstalled1Spy);
        await wb1.register();
        await nextEvent(wb1, 'controlling');

        const wb2 = new Workbox({scriptURL: uniq('sw-no-skip-waiting.tmp.js')});
        const externalInstalled2Spy = sandbox.spy();
        wb2.addEventListener('externalinstalled', externalInstalled2Spy);
        await wb2.register();
        await nextEvent(wb2, 'installed');

        expect(externalInstalled1Spy.callCount).to.equal(1);
        expect(externalInstalled1Spy.args[0][0]).to.equal(await wb2.getSW());

        // Assert the same method on the second instance isn't called.
        expect(externalInstalled2Spy.callCount).to.equal(0);
      });
    });

    describe(`externalwaiting`, function() {
      it(`runs when an external SW is waiting`, async function() {
        const wb1 = new Workbox({scriptURL: uniq('sw-clients-claim.tmp.js')});
        const waiting1Spy = sandbox.spy();
        wb1.addEventListener('waiting', waiting1Spy);
        const externalWaiting1Spy = sandbox.spy();
        wb1.addEventListener('externalwaiting', externalWaiting1Spy);
        await wb1.register();
        await nextEvent(wb1, 'controlling');

        const wb2 = new Workbox({scriptURL: uniq('sw-no-skip-waiting.tmp.js')});
        const waiting2Spy = sandbox.spy();
        wb2.addEventListener('waiting', waiting2Spy);
        const externalWaiting2Spy = sandbox.spy();
        wb2.addEventListener('externalwaiting', externalWaiting2Spy);
        await wb2.register();
        await nextEvent(wb2, 'waiting');

        expect(waiting1Spy.callCount).to.equal(0);
        expect(externalWaiting1Spy.callCount).to.equal(1);
        expect(externalWaiting1Spy.args[0][0]).to.equal(await wb2.getSW());

        expect(waiting2Spy.callCount).to.equal(1);
        expect(externalWaiting2Spy.callCount).to.equal(0);
      });
    });

    describe(`externalactivated`, function() {
      it(`runs when an external SW is found and activated`, async function() {
        const wb1 = new Workbox({scriptURL: uniq('sw-clients-claim.tmp.js')});
        const externalActivated1Spy = sandbox.spy();
        wb1.addEventListener('externalactivated', externalActivated1Spy);

        await wb1.register();
        await nextEvent(wb1, 'controlling');

        const wb2 = new Workbox({scriptURL: uniq('sw-skip-waiting.tmp.js')});
        const externalActivated2Spy = sandbox.spy();
        wb2.addEventListener('externalactivated', externalActivated2Spy);
        await wb2.register();
        await nextEvent(wb2, 'activated');

        expect(externalActivated1Spy.callCount).to.equal(1);
        expect(externalActivated1Spy.args[0][0]).to.equal(await wb2.getSW());

        // Assert the same method on the second instance isn't called.
        expect(externalActivated2Spy.callCount).to.equal(0);
      });
    });
  });
});
