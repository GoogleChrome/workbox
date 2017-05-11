importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');
importScripts('/__test/bundle/workbox-sw');

/* global goog */

const expect = self.chai.expect;
self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test swlib.precache', function() {
  it('should be accessible swlib.precache', function() {
    const swlib = new goog.SWLib();
    expect(swlib.precache).to.exist;
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
      const swlib = new goog.SWLib();
      try {
        swlib.precache(badInput.capture);
      } catch(err) {
        thrownError = err;
      }

      expect(thrownError).to.exist;
      thrownError.name.should.equal(badInput.errorName);
    });
  });

  it('should be able to add arrays of items to the cache.', function() {
    const corsOrigin = `${location.protocol}//${location.hostname}:${location.port}`;
    const validAssets1 = [
      '/__echo/date/1.1234.txt',
      {
        url: '/__echo/date/2.txt', revision: '1234',
      },
      `${corsOrigin}/__echo/date/3.1234.txt`,
      {
        url: `${corsOrigin}/__echo/date/4.txt`, revision: '1234',
      },
    ];
    const validAssets2 = [
      '/__echo/date/5.1234.txt',
      {
        url: '/__echo/date/6.txt', revision: '1234',
      },
      `${corsOrigin}/__echo/date/7.1234.txt`,
      {
        url: `${corsOrigin}/__echo/date/8.txt`, revision: '1234',
      },
    ];

    const swlib = new goog.SWLib();
    swlib.precache(validAssets1);
    swlib.precache(validAssets2);
  });
});
