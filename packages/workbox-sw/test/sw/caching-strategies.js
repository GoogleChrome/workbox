importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');
importScripts('/__test/bundle/workbox-sw');

/* global workbox */

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
      const workboxSW = new WorkboxSW();
      expect(workboxSW.strategies[strategy]).to.exist;
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
        const workboxSW = new WorkboxSW();
        expect(() => {
          workboxSW[strategy]({});
        }).to.throw;
      });
    });

    it(`should return a Handler when '${strategy}' is instantiated without arguments`, function() {
      const workboxSW = new WorkboxSW();
      const handler = workboxSW.strategies[strategy]();
      expect(handler.handle).to.exist;
      expect(handler.requestWrapper).to.exist;
    });

    it(`should return a Handler when '${strategy}' is instantiated with empty object`, function() {
      const workboxSW = new WorkboxSW();
      const handler = workboxSW.strategies[strategy]({});
      expect(handler.handle).to.exist;
      expect(handler.requestWrapper).to.exist;
    });

    it(`should return a Handler when '${strategy}' is instantiated with cacheName`, function() {
      const CACHE_NAME = 'hello-world-' + Date.now();
      const workboxSW = new WorkboxSW();
      const handler = workboxSW.strategies[strategy]({
        cacheName: CACHE_NAME,
      });
      expect(handler.handle).to.exist;
      expect(handler.requestWrapper).to.exist;
      handler.requestWrapper.cacheName.should.equal(CACHE_NAME);
    });

    it(`should return a Handler when '${strategy}' is instantiated with cacheExpiration options`, function() {
      const CACHE_EXPIRATION = {
        maxEntries: 10,
        maxAgeSeconds: 60 * 60,
      };
      const workboxSW = new WorkboxSW();
      const handler = workboxSW.strategies[strategy]({
        cacheExpiration: CACHE_EXPIRATION,
      });
      expect(handler.handle).to.exist;
      expect(handler.requestWrapper).to.exist;
      expect(handler.requestWrapper.plugins.has('cacheDidUpdate')).to.be.true;
      handler.requestWrapper.plugins.get('cacheDidUpdate').length.should.equal(1);
    });

    it(`should return a Handler when '${strategy}' is instantiated with broadcastCacheUpdate options`, function() {
      const CHANNEL_NAME = 'hello-world-' + Date.now();
      const BROADCAST_CACHE_UPDATE = {
        channelName: CHANNEL_NAME,
      };
      const workboxSW = new WorkboxSW();
      const handler = workboxSW.strategies[strategy]({
        broadcastCacheUpdate: BROADCAST_CACHE_UPDATE,
      });
      expect(handler.handle).to.exist;
      expect(handler.requestWrapper).to.exist;
      expect(handler.requestWrapper.plugins.has('cacheDidUpdate')).to.be.true;
      handler.requestWrapper.plugins.get('cacheDidUpdate').length.should.equal(1);
    });

    it(`should return a Handler when '${strategy}' is instantiated with cacheableResponse options`, function() {
      const CACHEABLE_RESPONSE_OPTIONS = {
        statuses: [0, 200, 404],
        headers: {
          'Example-Header-1': 'Header-Value-1',
          'Example-Header-2': 'Header-Value-2',
        },
      };
      const workboxSW = new WorkboxSW();
      const handler = workboxSW.strategies[strategy]({
        cacheableResponse: CACHEABLE_RESPONSE_OPTIONS,
      });
      expect(handler.handle).to.exist;
      expect(handler.requestWrapper).to.exist;
      expect(handler.requestWrapper.plugins.has('cacheWillUpdate')).to.be.true;
    });
  });
});
