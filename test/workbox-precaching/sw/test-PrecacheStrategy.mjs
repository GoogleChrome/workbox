/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {PrecacheStrategy} from 'workbox-precaching/PrecacheStrategy.mjs';
import {
  eventDoneWaiting,
  spyOnEvent,
} from '../../../infra/testing/helpers/extendable-event-utils.mjs';

function createFetchEvent(url, requestInit) {
  const event = new FetchEvent('fetch', {
    request: new Request(url, requestInit),
  });
  spyOnEvent(event);
  return event;
}

describe(`PrecacheStrategy()`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(async function () {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    sandbox.restore();
  });

  after(async function () {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    sandbox.restore();
  });

  describe(`handle()`, function () {
    it(`falls back to network by default on fetch`, async function () {
      sandbox.stub(self, 'fetch').callsFake((request) => {
        const response = new Response('Fetched Response');
        sandbox.replaceGetter(response, 'url', () => request.url);
        return response;
      });

      const cache = await caches.open(cacheNames.getPrecacheName());
      await cache.put(new Request('/one'), new Response('Cached Response'));

      const ps = new PrecacheStrategy();

      const response1 = await ps.handle(createFetchEvent('/one'));
      expect(await response1.text()).to.equal('Cached Response');
      expect(self.fetch.callCount).to.equal(0);

      const response2 = await ps.handle(createFetchEvent('/two'));
      expect(await response2.text()).to.equal('Fetched Response');
      expect(self.fetch.callCount).to.equal(1);

      // /two should not be there, since integrity isn't used.
      const cachedUrls = (await cache.keys()).map((request) => request.url);
      expect(cachedUrls).to.eql([`${location.origin}/one`]);
    });

    it(`falls back to network by default on fetch, and populates the cache if integrity is used`, async function () {
      sandbox.stub(self, 'fetch').callsFake((request) => {
        const response = new Response('Fetched Response');
        sandbox.replaceGetter(response, 'url', () => request.url);
        return response;
      });

      const cache = await caches.open(cacheNames.getPrecacheName());
      await cache.put(new Request('/one'), new Response('Cached Response'));

      const ps = new PrecacheStrategy();

      const response1 = await ps.handle(createFetchEvent('/one'));
      expect(await response1.text()).to.equal('Cached Response');
      expect(self.fetch.callCount).to.equal(0);

      const integrity = 'some-hash';
      const request = new Request('/two', {
        integrity,
      });
      const event = createFetchEvent(request.url, request);
      const response2 = await ps.handle({
        event,
        request,
        params: {
          integrity,
        },
      });
      expect(await response2.text()).to.equal('Fetched Response');
      expect(self.fetch.callCount).to.equal(1);

      // No integrity is used, so it shouldn't populate cache.
      const response3 = await ps.handle(createFetchEvent('/three'));
      expect(await response3.text()).to.equal('Fetched Response');
      expect(self.fetch.callCount).to.equal(2);

      // This should not populate the cache, because the params.integrity
      // doesn't match the request.integrity.
      const request4 = new Request('/four', {
        integrity,
      });
      const event4 = createFetchEvent(request4.url, request4);
      const response4 = await ps.handle({
        event: event4,
        request: request4,
        params: {
          integrity: 'does-not-match',
        },
      });
      expect(await response4.text()).to.equal('Fetched Response');
      expect(self.fetch.callCount).to.equal(3);

      // This should not populate the cache, because the request is no-cors
      // so we won't use integrity and won't populate the cache
      const request5 = new Request('/five', {
        integrity,
        mode: 'no-cors',
      });
      const event5 = createFetchEvent(request.url, request);
      const response5 = await ps.handle({
        event: event5,
        request: request5,
        params: {
          integrity,
        },
      });

      expect(await response5.text()).to.equal('Fetched Response');
      expect(self.fetch.callCount).to.equal(4);

      // /two should be there, since request.integrity matches params.integrity.
      // /three and /four shouldn't.
      const cachedUrls = (await cache.keys()).map((request) => request.url);
      expect(cachedUrls).to.eql([
        `${location.origin}/one`,
        `${location.origin}/two`,
      ]);
    });

    it(`just checks cache if fallbackToNetwork is false`, async function () {
      sandbox.stub(self, 'fetch').callsFake((request) => {
        const response = new Response('Fetched Response');
        sandbox.replaceGetter(response, 'url', () => request.url);
        return response;
      });

      const cache = await caches.open(cacheNames.getPrecacheName());
      await cache.put(new Request('/one'), new Response('Cached Response'));

      const ps = new PrecacheStrategy({fallbackToNetwork: false});

      const response1 = await ps.handle(createFetchEvent('/one'));
      expect(await response1.text()).to.equal('Cached Response');
      expect(self.fetch.callCount).to.equal(0);

      await expectError(
        () => ps.handle(createFetchEvent('/two')),
        'missing-precache-entry',
      );
    });

    it(`copies redirected responses`, async function () {
      sandbox.stub(self, 'fetch').callsFake((request) => {
        const response = new Response('Redirected Response');
        sandbox.replaceGetter(response, 'redirected', () => true);
        return Promise.resolve(response);
      });

      const request = new Request('/index.html');
      const event = new ExtendableEvent('install');
      spyOnEvent(event);

      const ps = new PrecacheStrategy();
      const strategyResponse = await ps.handle({event, request});

      expect(strategyResponse.redirected).to.equal(true);
      expect(await strategyResponse.text()).to.equal('Redirected Response');

      await eventDoneWaiting(event);

      const cache = await caches.open(cacheNames.getPrecacheName());
      const cachedResponse = await cache.match(request);

      expect(cachedResponse.redirected).to.equal(false);
      expect(await cachedResponse.text()).to.equal('Redirected Response');
    });

    it(`errors during install if the default plugin returns null`, async function () {
      // Also ensure that we don't cache the bad response;
      // see https://github.com/GoogleChrome/workbox/issues/2737
      const putStub = sandbox.stub().resolves();
      sandbox.stub(self.caches, 'open').resolves({put: putStub});

      sandbox.stub(self, 'fetch').resolves(
        new Response('Server Error', {
          status: 400,
        }),
      );

      const defaultPluginSpy = sandbox.spy(
        PrecacheStrategy.defaultPrecacheCacheabilityPlugin,
        'cacheWillUpdate',
      );

      const request = new Request('/index.html');
      const event = new ExtendableEvent('install');
      spyOnEvent(event);

      const ps = new PrecacheStrategy();
      await expectError(
        () => ps.handle({event, request}),
        'bad-precaching-response',
      );

      await eventDoneWaiting(event);
      expect(putStub.callCount).to.eql(0);
      // Confirm that the default plugin was called.
      expect(defaultPluginSpy.callCount).to.eql(1);
    });

    it(`doesn't error during install if the cacheWillUpdate plugin allows it`, async function () {
      const errorResponse = new Response('Server Error', {
        status: 400,
      });

      const putStub = sandbox.stub().resolves();
      sandbox.stub(self.caches, 'open').resolves({put: putStub});

      sandbox.stub(self, 'fetch').resolves(errorResponse);

      // Returning any valid Response will allow caching to proceed.
      const cacheWillUpdateStub = sandbox.stub().resolves(errorResponse);
      const defaultPluginSpy = sandbox.spy(
        PrecacheStrategy.defaultPrecacheCacheabilityPlugin,
        'cacheWillUpdate',
      );

      const request = new Request('/index.html');
      const event = new ExtendableEvent('install');
      spyOnEvent(event);

      const ps = new PrecacheStrategy({
        plugins: [
          {
            cacheWillUpdate: cacheWillUpdateStub,
          },
        ],
      });

      const response = await ps.handle({event, request});
      // The return value should be whatever fetch() returned.
      expect(response).to.eql(errorResponse);

      await eventDoneWaiting(event);

      expect(putStub.args).to.eql([[request, errorResponse]]);
      expect(cacheWillUpdateStub.callCount).to.eql(1);
      // The default plugin shouldn't be called if there's custom plugin(s).
      expect(defaultPluginSpy.callCount).to.eql(0);
    });

    it(`errors during install if any of the cacheWillUpdate plugins return null`, async function () {
      const errorResponse = new Response('Server Error', {
        status: 400,
      });

      const putStub = sandbox.stub().resolves();
      sandbox.stub(self.caches, 'open').resolves({put: putStub});

      sandbox.stub(self, 'fetch').resolves(errorResponse);

      const cacheWillUpdateAllowStub = sandbox.stub().resolves(errorResponse);
      const cacheWillUpdateDenyStub = sandbox.stub().resolves(null);

      const defaultPluginSpy = sandbox.spy(
        PrecacheStrategy.defaultPrecacheCacheabilityPlugin,
        'cacheWillUpdate',
      );

      const request = new Request('/index.html');
      const event = new ExtendableEvent('install');
      spyOnEvent(event);

      const ps = new PrecacheStrategy({
        plugins: [
          {
            cacheWillUpdate: cacheWillUpdateAllowStub,
          },
          {
            cacheWillUpdate: cacheWillUpdateDenyStub,
          },
        ],
      });

      await expectError(
        () => ps.handle({event, request}),
        'bad-precaching-response',
      );

      await eventDoneWaiting(event);

      expect(putStub.callCount).to.eql(0);
      expect(cacheWillUpdateAllowStub.callCount).to.eql(1);
      expect(cacheWillUpdateDenyStub.callCount).to.eql(1);
      expect(defaultPluginSpy.callCount).to.eql(0);
    });
  });

  describe('_useDefaultCacheabilityPluginIfNeeded()', function () {
    it(`should include the expected plugins by default`, async function () {
      const ps = new PrecacheStrategy();

      ps._useDefaultCacheabilityPluginIfNeeded();

      expect(ps.plugins).to.eql([
        PrecacheStrategy.copyRedirectedCacheableResponsesPlugin,
        PrecacheStrategy.defaultPrecacheCacheabilityPlugin,
      ]);

      // Confirm that calling it multiple times doesn't change anything.

      ps._useDefaultCacheabilityPluginIfNeeded();

      expect(ps.plugins).to.eql([
        PrecacheStrategy.copyRedirectedCacheableResponsesPlugin,
        PrecacheStrategy.defaultPrecacheCacheabilityPlugin,
      ]);
    });

    it(`should include the default plugin when the strategy has only non-cacheWillUpdate plugins`, async function () {
      const cacheKeyWillBeUsedPlugin = {
        cacheKeyWillBeUsed: sandbox.stub(),
      };
      const ps = new PrecacheStrategy({
        plugins: [cacheKeyWillBeUsedPlugin],
      });

      ps._useDefaultCacheabilityPluginIfNeeded();

      expect(ps.plugins).to.eql([
        cacheKeyWillBeUsedPlugin,
        PrecacheStrategy.copyRedirectedCacheableResponsesPlugin,
        PrecacheStrategy.defaultPrecacheCacheabilityPlugin,
      ]);

      // Confirm that calling it multiple times doesn't change anything.

      ps._useDefaultCacheabilityPluginIfNeeded();

      expect(ps.plugins).to.eql([
        cacheKeyWillBeUsedPlugin,
        PrecacheStrategy.copyRedirectedCacheableResponsesPlugin,
        PrecacheStrategy.defaultPrecacheCacheabilityPlugin,
      ]);
    });

    it(`should not include the default plugin when the strategy has one cacheWillUpdate plugin`, async function () {
      const cacheWillUpdatePlugin = {
        cacheWillUpdate: sandbox.stub(),
      };
      const ps = new PrecacheStrategy({
        plugins: [cacheWillUpdatePlugin],
      });

      ps._useDefaultCacheabilityPluginIfNeeded();

      expect(ps.plugins).to.eql([
        cacheWillUpdatePlugin,
        PrecacheStrategy.copyRedirectedCacheableResponsesPlugin,
      ]);

      // Confirm that calling it multiple times doesn't change anything.

      ps._useDefaultCacheabilityPluginIfNeeded();

      expect(ps.plugins).to.eql([
        cacheWillUpdatePlugin,
        PrecacheStrategy.copyRedirectedCacheableResponsesPlugin,
      ]);
    });

    it(`should not include the default plugin when the strategy has multiple cacheWillUpdate plugins`, async function () {
      const cacheWillUpdatePlugin1 = {
        cacheWillUpdate: sandbox.stub(),
      };
      const cacheWillUpdatePlugin2 = {
        cacheWillUpdate: sandbox.stub(),
      };
      const cacheKeyWillBeUsedPlugin = {
        cacheKeyWillBeUsed: sandbox.stub(),
      };
      const ps = new PrecacheStrategy({
        plugins: [
          cacheWillUpdatePlugin1,
          cacheKeyWillBeUsedPlugin,
          cacheWillUpdatePlugin2,
        ],
      });

      ps._useDefaultCacheabilityPluginIfNeeded();

      expect(ps.plugins).to.eql([
        cacheWillUpdatePlugin1,
        cacheKeyWillBeUsedPlugin,
        cacheWillUpdatePlugin2,
        PrecacheStrategy.copyRedirectedCacheableResponsesPlugin,
      ]);

      // Confirm that calling it multiple times doesn't change anything.

      ps._useDefaultCacheabilityPluginIfNeeded();

      expect(ps.plugins).to.eql([
        cacheWillUpdatePlugin1,
        cacheKeyWillBeUsedPlugin,
        cacheWillUpdatePlugin2,
        PrecacheStrategy.copyRedirectedCacheableResponsesPlugin,
      ]);
    });

    it(`should remove the default plugin if a cacheWillUpdate plugin has been added after the initial call`, async function () {
      const cacheWillUpdatePlugin = {
        cacheWillUpdate: sandbox.stub(),
      };
      const ps = new PrecacheStrategy();

      ps._useDefaultCacheabilityPluginIfNeeded();

      expect(ps.plugins).to.eql([
        PrecacheStrategy.copyRedirectedCacheableResponsesPlugin,
        PrecacheStrategy.defaultPrecacheCacheabilityPlugin,
      ]);

      // Explicitly add a cacheWillUpdate plugin. Real users will likely do this
      // via the addPlugins() method.
      ps.plugins.push(cacheWillUpdatePlugin);

      ps._useDefaultCacheabilityPluginIfNeeded();

      expect(ps.plugins).to.eql([
        PrecacheStrategy.copyRedirectedCacheableResponsesPlugin,
        cacheWillUpdatePlugin,
      ]);
    });
  });

  describe('defaultPrecacheCacheabilityPlugin', function () {
    it(`should return the same response when the status is 200`, async function () {
      const response = new Response('', {status: 200});

      const returnedResponse =
        await PrecacheStrategy.defaultPrecacheCacheabilityPlugin.cacheWillUpdate(
          {
            response,
          },
        );

      expect(returnedResponse).to.eql(response);
    });

    it(`should return the same response when the status is 0`, async function () {
      // You can't construct opaque responses, so stub out the getter.
      const response = new Response('', {status: 599});
      sandbox.stub(response, 'status').get(() => 0);

      const returnedResponse =
        await PrecacheStrategy.defaultPrecacheCacheabilityPlugin.cacheWillUpdate(
          {
            response,
          },
        );

      expect(returnedResponse).to.eql(response);
    });

    it(`should return null when the status is 404`, async function () {
      const response = new Response('', {status: 404});

      const returnedResponse =
        await PrecacheStrategy.defaultPrecacheCacheabilityPlugin.cacheWillUpdate(
          {
            response,
          },
        );

      expect(returnedResponse).to.be.null;
    });
  });
});
