importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/browser/mocha-utils.js');

importScripts('/packages/sw-lib/build/sw-lib.min.js');

/* global goog */

const expect = self.chai.expect;
self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test swlib.router', function() {
  it('should be accessible goog.swlib.router', function() {
    expect(goog.swlib.router).to.exist;
  });

  const badInput = [
    {
      capture: null,
      errorName: 'unsupported-route-type',
    },
    {
      capture: 123,
      errorName: 'unsupported-route-type',
    },
    {
      capture: true,
      errorName: 'unsupported-route-type',
    },
    {
      capture: false,
      errorName: 'unsupported-route-type',
    },
    {
      capture: {},
      errorName: 'unsupported-route-type',
    },
    {
      capture: [],
      errorName: 'unsupported-route-type',
    },
    {
      capture: '',
      errorName: 'empty-express-string',
    },
  ];
  badInput.forEach((badInput) => {
    it(`should throw on adding invalid route: '${badInput}'`, function() {
      let thrownError = null;
      try {
        goog.swlib.router.registerRoute(badInput.capture, () => {});
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).to.exist;
      thrownError.name.should.equal(badInput.errorName);
    });
  });

  it('should be able to register a valid express route', function() {
    const date = Date.now();
    const expressRoute = `/${date}/:id/test/`;
    const exampleRoute = `/${date}/1234567890/test/`;

    return new Promise((resolve, reject) => {
      goog.swlib.router.registerRoute(expressRoute, () => {
        // TODO: Checking ':id' makes it through to here.

        resolve();
      });
      const fetchEvent = new FetchEvent('fetch', {
        request: new Request(self.location.origin + exampleRoute),
      });

      self.dispatchEvent(fetchEvent);
    });
  });

  it('should be able to register a valid regex route', function() {
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
  });
});
