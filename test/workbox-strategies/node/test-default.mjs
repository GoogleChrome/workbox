import {expect} from 'chai';
import {CacheFirst, CacheOnly, NetworkFirst, NetworkOnly, StaleWhileRevalidate} from '../../../packages/workbox-strategies/_public.mjs';
import strategies from '../../../packages/workbox-strategies/_default.mjs';

describe(`[workbox-strategies] Default Export`, function() {
  const CUSTOM_PLUGIN = {};
  describe(`cacheFirst()`, function() {
    it(`should return a CacheFirst instance`, function() {
      const strategy = strategies.cacheFirst();
      expect(strategy).to.be.an.instanceof(CacheFirst);
    });

    it(`should allow extra plugins`, function() {
      const strategy = strategies.cacheFirst({
        plugins: [CUSTOM_PLUGIN],
      });
      expect(strategy._plugins.length).to.equal(1);
      expect(strategy._plugins[0]).to.equal(CUSTOM_PLUGIN);
    });
  });

  describe(`cacheOnly()`, function() {
    it(`should return a CacheOnly instance`, function() {
      const strategy = strategies.cacheOnly();
      expect(strategy).to.be.an.instanceof(CacheOnly);
    });

    it(`should allow extra plugins`, function() {
      const strategy = strategies.cacheOnly({
        plugins: [CUSTOM_PLUGIN],
      });
      expect(strategy._plugins.length).to.equal(1);
      expect(strategy._plugins[0]).to.equal(CUSTOM_PLUGIN);
    });
  });

  describe(`networkFirst()`, function() {
    it(`should return a NetworkFirst instance`, function() {
      const strategy = strategies.networkFirst();
      expect(strategy).to.be.an.instanceof(NetworkFirst);
    });

    it(`should allow extra plugins`, function() {
      const strategy = strategies.networkFirst({
        plugins: [CUSTOM_PLUGIN],
      });
      // Network first adds a plugin for opaque responses
      expect(strategy._plugins.length).to.equal(2);
      expect(strategy._plugins[1]).to.equal(CUSTOM_PLUGIN);
    });
  });

  describe(`networkOnly()`, function() {
    it(`should return a NetworkOnly instance`, function() {
      const strategy = strategies.networkOnly();
      expect(strategy).to.be.an.instanceof(NetworkOnly);
    });

    it(`should allow extra plugins`, function() {
      const strategy = strategies.networkOnly({
        plugins: [CUSTOM_PLUGIN],
      });
      expect(strategy._plugins.length).to.equal(1);
      expect(strategy._plugins[0]).to.equal(CUSTOM_PLUGIN);
    });
  });

  describe(`StaleWhileRevalidate()`, function() {
    it(`should return a StaleWhileRevalidate instance`, function() {
      const strategy = strategies.staleWhileRevalidate();
      expect(strategy).to.be.an.instanceof(StaleWhileRevalidate);
    });

    it(`should allow extra plugins`, function() {
      const strategy = strategies.staleWhileRevalidate({
        plugins: [CUSTOM_PLUGIN],
      });
      // Stale while revalidate adds a plugin for opaque resposnes
      expect(strategy._plugins.length).to.equal(2);
      expect(strategy._plugins[1]).to.equal(CUSTOM_PLUGIN);
    });
  });
});
