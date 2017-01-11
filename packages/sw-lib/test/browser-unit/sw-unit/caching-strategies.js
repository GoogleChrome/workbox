importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');

importScripts('/packages/sw-lib/build/sw-lib.min.js');

/* global goog */

const expect = self.chai.expect;
self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test caching strategies.', function() {
  const strategies = [
    'cacheFirst',
    'cacheOnly',
    'networkFirst',
    'networkOnly',
    'staleWhileRevalidate',
  ];
  strategies.forEach((strategy) => {
    it(`should have '${strategy}' available`, function() {
      expect(goog.swlib[strategy]).to.exist;
    });

    const badArguments = [
      true,
      false,
      [],
      1234,
      'abcd',
    ];

    badArguments.forEach((badArgument) => {
      it(`should throw an error for '${strategy}' when argument is '${JSON.stringify(badArgument)}'`, function() {
        expect(() => {
          goog.swlib[strategy]({});
        }).to.throw;
      });
    });

    it(`should return a Handler when '${strategy}' is instantiated without arguments`, function() {
      const handler = goog.swlib[strategy]();
      expect(handler.handle).to.exist;
      expect(handler.requestWrapper).to.exist;
    });

    it(`should return a Handler when '${strategy}' is instantiated with empty object`, function() {
      const handler = goog.swlib[strategy]({});
      expect(handler.handle).to.exist;
      expect(handler.requestWrapper).to.exist;
    });

    it(`should return a Handler when '${strategy}' is instantiated with cacheName`, function() {
      const CACHE_NAME = 'hello-world-' + Date.now();
      const handler = goog.swlib[strategy]({
        cacheName: CACHE_NAME,
      });
      expect(handler.handle).to.exist;
      expect(handler.requestWrapper).to.exist;
      handler.requestWrapper.cacheName.should.equal(CACHE_NAME);
    });

    it(`should return a Handler when '${strategy}' is instantiated with cacheExpiration options`, function() {
      // TODO: Is the cache name needed long term? This introduces a difference
      // between the request wrapper and the cache expiration behavior.
      const CACHE_NAME = 'hello-world-' + Date.now();
      const CACHE_EXPIRATION = {
        cacheName: CACHE_NAME,
        maxEntries: 10,
        maxAgeSeconds: 60 * 60,
      };
      const handler = goog.swlib[strategy]({
        cacheExpiration: CACHE_EXPIRATION,
      });
      expect(handler.handle).to.exist;
      expect(handler.requestWrapper).to.exist;
      expect(handler.requestWrapper.behaviorCallbacks.cacheDidUpdate).to.exist;
      handler.requestWrapper.behaviorCallbacks.cacheDidUpdate.length.should.equal(1);
    });

    it(`should return a Handler when '${strategy}' is instantiated with broadcastCacheUpdate options`, function() {
      const CHANNEL_NAME = 'hello-world-' + Date.now();
      const BROADCAST_CACHE_UPDATE = {
        channelName: CHANNEL_NAME,
      };
      const handler = goog.swlib[strategy]({
        broadcastCacheUpdate: BROADCAST_CACHE_UPDATE,
      });
      expect(handler.handle).to.exist;
      expect(handler.requestWrapper).to.exist;
      expect(handler.requestWrapper.behaviorCallbacks.cacheDidUpdate).to.exist;
      handler.requestWrapper.behaviorCallbacks.cacheDidUpdate.length.should.equal(1);
    });
  });
});
