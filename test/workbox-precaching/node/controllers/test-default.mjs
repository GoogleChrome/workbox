import sinon from 'sinon';
import {expect} from 'chai';
import clearRequire from 'clear-require';

import core from '../../../../packages/workbox-core/index.mjs';
import PrecacheController from '../../../../packages/workbox-precaching/controllers/PrecacheController.mjs';

describe(`[workbox-precaching] default export`, function() {
  const sandbox = sinon.sandbox.create();
  let precaching;

  beforeEach(async function() {
    sandbox.restore();

    // console.log('CLEARNING <-----------------------------');
    clearRequire('../../../../packages/workbox-precaching/default.mjs');

    const module = await import('../../../../packages/workbox-precaching/default.mjs');
    precaching = module.default;
  });

  after(function() {
    sandbox.restore();
  });

  describe(`precache()`, function() {
    it(`should only install and activate listeners once`, function() {
      sandbox.stub(self, 'addEventListener');

      precaching.precache(['/']);
      precaching.precache(['/2']);

      expect(self.addEventListener.callCount).to.equal(2);
      expect(self.addEventListener.args[0][0]).to.equal('install');
      expect(self.addEventListener.args[1][0]).to.equal('activate');
    });

    it(`should call install and cleanup on install and activate`, async function() {
      sandbox.spy(PrecacheController.prototype, 'install');
      sandbox.spy(PrecacheController.prototype, 'cleanup');

      expect(PrecacheController.prototype.install.callCount).to.equal(0);

      precaching.precache(['/']);

      const installEvent = new ExtendableEvent('install');
      let controllerInstallPromise;
      installEvent.waitUntil = (promise) => {
        controllerInstallPromise = promise;
      };
      self.dispatchEvent(installEvent);

      await controllerInstallPromise;
      expect(PrecacheController.prototype.install.callCount).to.equal(1);

      const activateEvent = new ExtendableEvent('activate');
      let controllerActivatePromise;
      activateEvent.waitUntil = (promise) => {
        controllerActivatePromise = promise;
      };
      self.dispatchEvent(activateEvent);

      await controllerActivatePromise;
      expect(PrecacheController.prototype.cleanup.callCount).to.equal(1);
    });
  });

  describe(`addRoute()`, function() {
    it(`should add a fetch listener when called`, function() {
      sandbox.stub(self, 'addEventListener');

      precaching.addRoute();

      expect(self.addEventListener.callCount).to.equal(1);
      expect(self.addEventListener.args[0][0]).to.equal('fetch');
    });

    it(`should not allow adding route twice`, function() {
      sandbox.stub(self, 'addEventListener');

      precaching.addRoute();
      precaching.addRoute();

      expect(self.addEventListener.callCount).to.equal(1);
      expect(self.addEventListener.args[0][0]).to.equal('fetch');
    });

    it(`should add a fetch listener that only matches precached urls`, async function() {
      let fetchCb;
      sandbox.stub(self, 'addEventListener').callsFake((eventName, cb) => {
        if (eventName === 'fetch') {
          fetchCb = cb;
        }
      });

      precaching.addRoute();
      precaching.precache(['/']);

      const cachedResponse = new Response('Injected Response');
      const cache = await caches.open(core.cacheNames.precache);
      cache.put(new URL('/', location).href, cachedResponse);

      const fetchEvent = new FetchEvent('fetch', {
        request: new Request('/'),
      });
      let fetchPromise;
      fetchEvent.respondWith = (promise) => {
        fetchPromise = promise;
      };
      fetchCb(fetchEvent);

      const response = await fetchPromise;
      expect(response).to.exist;
      expect(response).to.equal(cachedResponse);

      const unprecachedFetchEvent = new FetchEvent('fetch', {
        request: new Request('/url-isnt-precached'),
      });

      unprecachedFetchEvent.respondWith = () => {
        throw new Error('respondWith() must not be called for non-precached URLs');
      };

      const result = fetchCb(unprecachedFetchEvent);
      expect(typeof result).to.equal('undefined');
    });
  });
});
