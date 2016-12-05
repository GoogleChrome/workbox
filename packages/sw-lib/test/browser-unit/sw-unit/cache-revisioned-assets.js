importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/browser/mocha-utils.js');

importScripts('/packages/sw-lib/build/sw-lib.min.js');
importScripts('/packages/sw-routing/build/sw-routing.min.js');

/* global goog */

const expect = self.chai.expect;
self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test swlib.cacheRevisionedAssets', function() {
  it('should be accessible goog.swlib.cacheRevisionedAssets', function() {
    expect(goog.swlib.cacheRevisionedAssets).to.exist;
  });

  const badInput = [
    {
      capture: null,
      errorName: 'bad-revisioned-cache-list',
    },
    {
      capture: 123,
      errorName: 'bad-revisioned-cache-list',
    },
    {
      capture: true,
      errorName: 'bad-revisioned-cache-list',
    },
    {
      capture: false,
      errorName: 'bad-revisioned-cache-list',
    },
    {
      capture: {},
      errorName: 'bad-revisioned-cache-list',
    },
    {
      capture: '',
      errorName: 'bad-revisioned-cache-list',
    },
  ];
  badInput.forEach((badInput) => {
    it(`should throw on adding invalid route: '${JSON.stringify(badInput)}'`, function() {
      let thrownError = null;
      try {
        goog.swlib.cacheRevisionedAssets(badInput.capture);
      } catch(err) {
        thrownError = err;
      }

      expect(thrownError).to.exist;
      thrownError.name.should.equal(badInput.errorName);
    });
  });

  it('should be able to add array of items to the cache.', function() {
    const corsOrigin = `${location.protocol}//${location.hostname}:${location.port}`;
    const validAssets1 = [
      '/__echo/date/1.1234.txt',
      {
        path: '/__echo/date/2.txt', revision: '1234',
      },
      `${corsOrigin}/__echo/date/3.1234.txt`,
      {
        path: `${corsOrigin}/__echo/date/4.txt`, revision: '1234',
      },
    ];
    const validAssets2 = [
      '/__echo/date/5.1234.txt',
      {
        path: '/__echo/date/6.txt', revision: '1234',
      },
      `${corsOrigin}/__echo/date/7.1234.txt`,
      {
        path: `${corsOrigin}/__echo/date/8.txt`, revision: '1234',
      },
    ];

    goog.swlib.cacheRevisionedAssets(validAssets1);
    goog.swlib.cacheRevisionedAssets(validAssets2);
  });

  /** it('should be able to register a valid regex route', function() {
    const regexRoute = /\/1234567890\/\w+\//;
    const exampleRoute = `/1234567890/test/`;

    return new Promise((resolve, reject) => {
      goog.swlib.router.registerRoute(regexRoute, () => {
        // TODO: Checking 'test' capture group makes it through to here.

        resolve();
      });
      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(self.location.origin + exampleRoute),
      });

      self.dispatchEvent(fetchEvent);
    });
  });

  it('should be able to register a valid Route instance route', function() {
    const exampleRoute = `/1234567890/test/`;

    return new Promise((resolve, reject) => {
      const routeInstance = new goog.swlib.Route({
        match: (url) => true,
        handler: {
          handle: () => {
            // TODO: Check returned value from match makes it through to here.

            resolve();
          },
        },
      });

      goog.swlib.router.registerRoute(routeInstance);
      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(self.location.origin + exampleRoute),
      });

      self.dispatchEvent(fetchEvent);
    });
  });**/
});
