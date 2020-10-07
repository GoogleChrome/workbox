/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {PrecacheStrategy} from 'workbox-precaching/PrecacheStrategy.mjs';
import {eventDoneWaiting, spyOnEvent} from '../../../infra/testing/helpers/extendable-event-utils.mjs';


function createFetchEvent(url) {
  const event = new FetchEvent('fetch', {
    request: new Request(url),
  });
  spyOnEvent(event);
  return event;
}

describe(`PrecacheStrategy()`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(async function() {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    sandbox.restore();
  });

  after(async function() {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    sandbox.restore();
  });

  describe(`.handle`, function() {
    it(`falls back to network by default on fetch`, async function() {
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
    });

    it(`just checks cache if fallbackToNetwork is false`, async function() {
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
          () => ps.handle(createFetchEvent('/two')), 'missing-precache-entry');
    });

    it(`copies redirected responses`, async function() {
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

    it(`errors on 400+ responses during install if no custom cacheWillUpdate plugin callback is used`, async function() {
      sandbox.stub(self, 'fetch').callsFake((request) => {
        return new Response('Server Error', {status: 400});
      });

      const request = new Request('/index.html');
      const event = new ExtendableEvent('install');
      spyOnEvent(event);

      const ps = new PrecacheStrategy();
      await expectError(
          () => ps.handle({event, request}), 'bad-precaching-response');
    });

    it(`doesn't error on 400+ when a custom cacheWillUpdate plugin callback is used`, async function() {
      sandbox.stub(self, 'fetch').callsFake((request) => {
        return new Response('Server Error', {status: 400});
      });

      const request = new Request('/index.html');
      const event = new ExtendableEvent('install');
      spyOnEvent(event);

      const ps = new PrecacheStrategy({
        plugins: [{
          cacheWillUpdate: sandbox.spy(),
        }],
      });

      const response = await ps.handle({event, request});
      expect(response).to.be.instanceOf(Response);
    });
  });
});
