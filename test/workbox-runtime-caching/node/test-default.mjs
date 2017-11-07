import {expect} from 'chai';
import {CacheFirst, CacheOnly, NetworkFirst, NetworkOnly, StaleWhileRevalidate} from '../../../packages/workbox-runtime-caching/_public.mjs';
import strategies from '../../../packages/workbox-runtime-caching/_default.mjs';
import {CacheExpirationPlugin} from '../../../packages/workbox-cache-expiration/CacheExpirationPlugin.mjs';

describe(`[workbox-runtime-caching] Default Export`, function() {
  const CUSTOM_PLUGIN = {};
  describe(`cacheFirst()`, function() {
    it(`should return a CacheFirst instance`, function() {
      const strategy = strategies.cacheFirst();
      expect(strategy).to.be.an.instanceof(CacheFirst);
    });

    it(`should have cacheExpiration options converted to plugins`, function() {
      const strategy = strategies.cacheFirst({
        cacheName: 'test-cache-name',
        cacheExpiration: {
          maxAgeSeconds: 1,
          maxEntries: 2,
        },
      });
      expect(strategy._cacheName).to.equal('test-cache-name');
      expect(strategy._plugins.length).to.equal(1);
      expect(strategy._plugins[0]).to.be.instanceOf(CacheExpirationPlugin);
      expect(strategy._plugins[0]._config.maxAgeSeconds).to.equal(1);
      expect(strategy._plugins[0]._config.maxEntries).to.equal(2);
    });

    it(`should allow extra plugins`, function() {
      const strategy = strategies.cacheFirst({
        cacheExpiration: {
          maxAgeSeconds: 1,
          maxEntries: 2,
        },
        plugins: [CUSTOM_PLUGIN],
      });
      expect(strategy._plugins.length).to.equal(2);
      expect(strategy._plugins[1]).to.equal(CUSTOM_PLUGIN);
    });
  });

  describe(`cacheOnly()`, function() {
    it(`should return a CacheOnly instance`, function() {
      const strategy = strategies.cacheOnly();
      expect(strategy).to.be.an.instanceof(CacheOnly);
    });

    it(`should have cacheExpiration options converted to plugins`, function() {
      const strategy = strategies.cacheOnly({
        cacheName: 'test-cache-name',
        cacheExpiration: {
          maxAgeSeconds: 1,
          maxEntries: 2,
        },
      });
      expect(strategy._cacheName).to.equal('test-cache-name');
      expect(strategy._plugins.length).to.equal(1);
      expect(strategy._plugins[0]).to.be.instanceOf(CacheExpirationPlugin);
      expect(strategy._plugins[0]._config.maxAgeSeconds).to.equal(1);
      expect(strategy._plugins[0]._config.maxEntries).to.equal(2);
    });

    it(`should allow extra plugins`, function() {
      const strategy = strategies.cacheOnly({
        cacheExpiration: {
          maxAgeSeconds: 1,
          maxEntries: 2,
        },
        plugins: [CUSTOM_PLUGIN],
      });
      expect(strategy._plugins.length).to.equal(2);
      expect(strategy._plugins[1]).to.equal(CUSTOM_PLUGIN);
    });
  });

  describe(`networkFirst()`, function() {
    it(`should return a NetworkFirst instance`, function() {
      const strategy = strategies.networkFirst();
      expect(strategy).to.be.an.instanceof(NetworkFirst);
    });

    it(`should have cacheExpiration options converted to plugins`, function() {
      const strategy = strategies.networkFirst({
        cacheName: 'test-cache-name',
        networkTimeoutSeconds: 3,
        cacheExpiration: {
          maxAgeSeconds: 1,
          maxEntries: 2,
        },
      });
      expect(strategy._cacheName).to.equal('test-cache-name');
      expect(strategy._networkTimeoutSeconds).to.equal(3);

      // 2 Plugins because of opaque caching plugin.
      expect(strategy._plugins.length).to.equal(2);
      expect(strategy._plugins[1]).to.be.instanceOf(CacheExpirationPlugin);
      expect(strategy._plugins[1]._config.maxAgeSeconds).to.equal(1);
      expect(strategy._plugins[1]._config.maxEntries).to.equal(2);
    });

    it(`should allow extra plugins`, function() {
      const strategy = strategies.networkFirst({
        cacheExpiration: {
          maxAgeSeconds: 1,
          maxEntries: 2,
        },
        plugins: [CUSTOM_PLUGIN],
      });
      expect(strategy._plugins.length).to.equal(3);
      expect(strategy._plugins[2]).to.equal(CUSTOM_PLUGIN);
    });
  });

  describe(`networkOnly()`, function() {
    it(`should return a NetworkOnly instance`, function() {
      const strategy = strategies.networkOnly();
      expect(strategy).to.be.an.instanceof(NetworkOnly);
    });

    it(`should have cacheExpiration options converted to plugins`, function() {
      const strategy = strategies.networkOnly({
        cacheName: 'test-cache-name',
        cacheExpiration: {
          maxAgeSeconds: 1,
          maxEntries: 2,
        },
      });
      expect(strategy._cacheName).to.equal('test-cache-name');
      expect(strategy._plugins.length).to.equal(1);
      expect(strategy._plugins[0]).to.be.instanceOf(CacheExpirationPlugin);
      expect(strategy._plugins[0]._config.maxAgeSeconds).to.equal(1);
      expect(strategy._plugins[0]._config.maxEntries).to.equal(2);
    });

    it(`should allow extra plugins`, function() {
      const strategy = strategies.networkOnly({
        cacheExpiration: {
          maxAgeSeconds: 1,
          maxEntries: 2,
        },
        plugins: [CUSTOM_PLUGIN],
      });
      expect(strategy._plugins.length).to.equal(2);
      expect(strategy._plugins[1]).to.equal(CUSTOM_PLUGIN);
    });
  });

  describe(`StaleWhileRevalidate()`, function() {
    it(`should return a StaleWhileRevalidate instance`, function() {
      const strategy = strategies.staleWhileRevalidate();
      expect(strategy).to.be.an.instanceof(StaleWhileRevalidate);
    });

    it(`should have cacheExpiration options converted to plugins`, function() {
      const strategy = strategies.staleWhileRevalidate({
        cacheName: 'test-cache-name',
        cacheExpiration: {
          maxAgeSeconds: 1,
          maxEntries: 2,
        },
      });
      expect(strategy._cacheName).to.equal('test-cache-name');

      // 2 Plugins because of opaque caching plugin.
      expect(strategy._plugins.length).to.equal(2);
      expect(strategy._plugins[1]).to.be.instanceOf(CacheExpirationPlugin);
      expect(strategy._plugins[1]._config.maxAgeSeconds).to.equal(1);
      expect(strategy._plugins[1]._config.maxEntries).to.equal(2);
    });

    it(`should allow extra plugins`, function() {
      const strategy = strategies.staleWhileRevalidate({
        cacheExpiration: {
          maxAgeSeconds: 1,
          maxEntries: 2,
        },
        plugins: [CUSTOM_PLUGIN],
      });
      expect(strategy._plugins.length).to.equal(3);
      expect(strategy._plugins[2]).to.equal(CUSTOM_PLUGIN);
    });
  });
});
