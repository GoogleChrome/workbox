/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {ExpirationPlugin} from 'workbox-expiration/ExpirationPlugin.mjs';
import {CacheExpiration} from 'workbox-expiration/CacheExpiration.mjs';
import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {executeQuotaErrorCallbacks} from 'workbox-core/_private/executeQuotaErrorCallbacks.mjs';

describe(`ExpirationPlugin`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(function () {
    sandbox.restore();
  });

  after(function () {
    sandbox.restore();
  });

  describe(`constructor`, function () {
    it(`should throw for no config`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(() => {
        new ExpirationPlugin();
      }, 'max-entries-or-age-required');
    });

    it(`should throw for non-number maxEntries`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(() => {
        new ExpirationPlugin({
          maxEntries: 'Hi',
        });
      }, 'incorrect-type');
    });

    it(`should throw for non-number maxAgeSeconds`, function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(() => {
        new ExpirationPlugin({
          maxAgeSeconds: 'Hi',
        });
      }, 'incorrect-type');
    });

    it(`should construct with just maxAgeSeconds`, function () {
      const plugin = new ExpirationPlugin({
        maxAgeSeconds: 10,
      });
      expect(plugin._maxAgeSeconds).to.equal(10);
    });

    it(`should construct with just maxEntries`, function () {
      const plugin = new ExpirationPlugin({
        maxEntries: 10,
      });
      expect(plugin._config.maxEntries).to.equal(10);
    });

    it(`should register a quota error callback when purgeOnQuotaError is true`, async function () {
      const plugin = new ExpirationPlugin({
        maxEntries: 10,
        purgeOnQuotaError: true,
      });
      plugin.deleteCacheAndMetadata = sandbox.stub();

      await executeQuotaErrorCallbacks();

      expect(plugin.deleteCacheAndMetadata.calledOnce).to.be.true;
    });

    it(`should not register a quota error callback when purgeOnQuotaError is false`, async function () {
      const plugin = new ExpirationPlugin({
        maxEntries: 10,
        purgeOnQuotaError: false,
      });
      plugin.deleteCacheAndMetadata = sandbox.stub();

      await executeQuotaErrorCallbacks();

      expect(plugin.deleteCacheAndMetadata.called).to.be.false;
    });

    it(`should pass matchOptions through to the CacheExpiration instance`, async function () {
      const plugin = new ExpirationPlugin({
        maxEntries: 10,
        matchOptions: {
          ignoreVary: true,
        },
      });

      const cacheExpiration = plugin._getCacheExpiration('test-matchOptions');
      expect(cacheExpiration._matchOptions).to.eql({ignoreVary: true});
    });
  });

  describe(`cachedResponseWillBeUsed()`, function () {
    it(`should expose a cachedResponseWillBeUsed() method`, function () {
      const plugin = new ExpirationPlugin({maxAgeSeconds: 1});
      expect(plugin).to.respondTo('cachedResponseWillBeUsed');
    });

    it(`should return cachedResponse when cachedResponseWillBeUsed() is called and Responses Data header it valid`, async function () {
      // Just to ensure no timing flakiness in test.
      sandbox.useFakeTimers({
        toFake: ['Date'],
      });

      const dateString = new Date().toUTCString();
      const cachedResponse = new Response('', {headers: {date: dateString}});

      const plugin = new ExpirationPlugin({maxAgeSeconds: 1});

      const expirationManager = plugin._getCacheExpiration('test-cache');
      sandbox.spy(expirationManager, 'expireEntries');

      expect(
        await plugin.cachedResponseWillBeUsed({
          request: new Request('/'),
          cacheName: 'test-cache',
          cachedResponse,
        }),
      ).to.eql(cachedResponse);
      expect(expirationManager.expireEntries.callCount).to.equal(1);
    });

    it(`should return null when cachedResponseWillBeUsed() is called and Responses Date header is too old`, async function () {
      const clock = sandbox.useFakeTimers({
        toFake: ['Date'],
      });

      const dateString = new Date().toUTCString();
      const cachedResponse = new Response('', {headers: {date: dateString}});

      // Clock past the expiration of the Data header
      clock.tick(1000 + 1);

      const plugin = new ExpirationPlugin({maxAgeSeconds: 1});

      const expirationManager = plugin._getCacheExpiration('test-cache');
      sandbox.spy(expirationManager, 'expireEntries');

      expect(
        await plugin.cachedResponseWillBeUsed({
          request: new Request('/'),
          cacheName: 'test-cache',
          cachedResponse,
        }),
      ).to.eql(null);
      expect(expirationManager.expireEntries.callCount).to.equal(1);
    });

    it(`should handle a null cachedResponse`, async function () {
      const plugin = new ExpirationPlugin({maxAgeSeconds: 1});

      const expirationManager = plugin._getCacheExpiration('test-cache');
      sandbox.spy(expirationManager, 'expireEntries');

      expect(
        await plugin.cachedResponseWillBeUsed({
          cacheName: 'test-cache',
          cachedResponse: null,
        }),
      ).to.eql(null);
    });

    it(`should update the timestamp for the request URL`, async function () {
      const plugin = new ExpirationPlugin({maxEntries: 10});

      const expirationManager = plugin._getCacheExpiration('test-cache');
      sandbox.spy(expirationManager, 'updateTimestamp');

      await plugin.cachedResponseWillBeUsed({
        request: new Request('/one'),
        cacheName: 'test-cache',
        cachedResponse: new Response(''),
      });

      expect(expirationManager.updateTimestamp.callCount).to.equal(1);
      expect(expirationManager.updateTimestamp.args[0][0]).to.equal(
        `${location.origin}/one`,
      );
    });
  });

  describe(`_isResponseDateFresh()`, function () {
    it(`should return true when maxAgeSeconds is not set`, function () {
      const plugin = new ExpirationPlugin({maxEntries: 1});
      const isFresh = plugin._isResponseDateFresh(new Response('Hi'));
      expect(isFresh).to.equal(true);
    });

    it(`should return true when there is no Date header`, function () {
      const plugin = new ExpirationPlugin({maxAgeSeconds: 1});
      const isFresh = plugin._isResponseDateFresh(
        new Response('Hi', {
          // TODO: Remove this when https://github.com/pinterest/service-workers/issues/72
          // is fixed.
          headers: {},
        }),
      );
      expect(isFresh).to.equal(true);
    });

    it(`should return true when the Date header is invalid`, function () {
      const plugin = new ExpirationPlugin({maxAgeSeconds: 1});
      const isFresh = plugin._isResponseDateFresh(
        new Response('Hi', {
          headers: {date: 'invalid header'},
        }),
      );
      expect(isFresh).to.equal(true);
    });
  });

  describe(`cacheDidUpdate()`, function () {
    it(`should expose a cacheDidUpdate() method`, function () {
      const plugin = new ExpirationPlugin({maxAgeSeconds: 1});
      expect(plugin).to.respondTo('cacheDidUpdate');
    });

    it(`should update timestamps and expire entries`, async function () {
      const cacheName = 'test-cache';
      const url = new URL('/test', self.location).toString();
      const request = new Request(url);
      const plugin = new ExpirationPlugin({maxAgeSeconds: 10});

      sandbox.spy(CacheExpiration.prototype, 'updateTimestamp');
      sandbox.spy(CacheExpiration.prototype, 'expireEntries');

      await plugin.cacheDidUpdate({cacheName, request});

      expect(CacheExpiration.prototype.updateTimestamp.callCount).to.equal(1);
      expect(CacheExpiration.prototype.updateTimestamp.args[0][0]).to.equal(
        url,
      );
      expect(CacheExpiration.prototype.expireEntries.callCount).to.equal(1);
    });
  });

  describe(`_getCacheExpiration()`, function () {
    it(`should reject when called with the default runtime cache name`, async function () {
      const plugin = new ExpirationPlugin({maxAgeSeconds: 1});
      await expectError(
        () => plugin._getCacheExpiration(cacheNames.getRuntimeName()),
        'expire-custom-caches-only',
      );
    });
  });
});
