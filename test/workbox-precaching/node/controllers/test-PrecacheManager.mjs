import {expect} from 'chai';
import sinon from 'sinon';
import clearRequire from 'clear-require';

import expectError from '../../../../infra/utils/expectError';
import generateTestVariants from '../../../../infra/utils/generate-variant-tests'

// This sets Request mock on the Global scope
import '../../../mocks/Request.mjs';

const PRECACHE_MANAGER_PATH = '../../../../packages/workbox-precaching/controllers/PrecacheManager.mjs';

describe(`PrecacheManager`, function() {
  const sandbox = sinon.sandbox.create();

  beforeEach(function() {
    clearRequire.all();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`constructor`, function() {
    it(`should construct without any inputs`, async function() {
      const PrecacheManager = (await import(PRECACHE_MANAGER_PATH)).default;
      expect(() => {
        new PrecacheManager();
      }).to.not.throw();
    });
  });

  describe(`addToCacheList() with bad values`, function() {
    describe(`with bad values`, function() {
      // TODO Bad input tests
      const badTopLevelInputs = [
        {},
        true,
        false,
        123,
        '',
        null,
        undefined
      ];
      generateTestVariants(`should throw when passing in non-array values.`, badTopLevelInputs, async (variant) => {
        const PrecacheManager = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheManager = new PrecacheManager();
        expectError(() => {
          precacheManager.addToCacheList(variant);
        }, 'not-an-array');
      });

      const badNestedInputs = [
        {},
        true,
        false,
        123,
        '',
        null,
        undefined,
        [],
      ];
      generateTestVariants(`should throw when passing in invalid inputs in the array.`, badNestedInputs, async (variant) => {
        const PrecacheManager = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheManager = new PrecacheManager();
        // TODO: Check this is a workbox error with correct error name
        expect(() => {
          precacheManager.addToCacheList([variant]);
        }).to.throw();
      });
    });

    describe(`with strings`, function() {
      it(`should add strings to cache entries`, async function() {
        const PrecacheManager = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheManager = new PrecacheManager();

        const inputUrls = [
          '/',
          '/hello.html',
          '/styles/hello.css',
          '/scripts/controllers/hello.js',
        ];
        precacheManager.addToCacheList(inputUrls);

        expect(precacheManager._entriesToCacheMap.size).to.equal(inputUrls.length);

        inputUrls.forEach((inputUrl) => {
          const entry = precacheManager._entriesToCacheMap.get(inputUrl);
          expect(entry.entryId).to.equal(inputUrl);
          expect(entry.revision).to.equal(inputUrl);
          expect(entry.request.url).to.equal(inputUrl);
        });
      });

      it(`should warn developers on non-prod builds`, async function() {
        process.env.NODE_ENV = 'dev';

        const PrecacheManager = (await import(PRECACHE_MANAGER_PATH)).default;

        const stub = sandbox.stub(console, 'debug');

        const precacheManager = new PrecacheManager();
        precacheManager.addToCacheList(['/example.html']);

        expect(stub.callCount).to.be.gt(0);
      });

      it(`should not warn developers on prod builds`, async function() {
        process.env.NODE_ENV = 'prod';

        const PrecacheManager = (await import(PRECACHE_MANAGER_PATH)).default;

        const stub = sandbox.stub(console, 'debug');

        const precacheManager = new PrecacheManager();
        precacheManager.addToCacheList(['/example.html']);

        expect(stub.callCount).to.equal(0);
      });

      it(`should remove duplicate string entries`, async function() {
        const PrecacheManager = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheManager = new PrecacheManager();

        const url = '/duplicate.html';
        const inputUrls = [
          url,
          url,
        ];
        precacheManager.addToCacheList(inputUrls);

        expect(precacheManager._entriesToCacheMap.size).to.equal(1);

        const entry = precacheManager._entriesToCacheMap.get(url);
        expect(entry.entryId).to.equal(url);
        expect(entry.revision).to.equal(url);
        expect(entry.request.url).to.equal(url);
      });
    });

    describe(`with objects containing urls`, function() {
      it(`should add objects to cache entries`, async function() {
        const PrecacheManager = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheManager = new PrecacheManager();

        const inputObjects = [
          { url: '/' },
          { url: '/hello.html' },
          { url: '/styles/hello.css' },
          { url: '/scripts/controllers/hello.js' },
        ];
        precacheManager.addToCacheList(inputObjects);

        expect(precacheManager._entriesToCacheMap.size).to.equal(inputObjects.length);

        inputObjects.forEach((inputObject) => {
          const entry = precacheManager._entriesToCacheMap.get(inputObject.url);
          expect(entry.entryId).to.equal(inputObject.url);
          expect(entry.revision).to.equal(inputObject.url);
          expect(entry.request.url).to.equal(inputObject.url);
        });
      });

      it(`should warn developers on non-prod builds`, async function() {
        process.env.NODE_ENV = 'dev';

        const PrecacheManager = (await import(PRECACHE_MANAGER_PATH)).default;

        const stub = sandbox.stub(console, 'debug');

        const precacheManager = new PrecacheManager();
        precacheManager.addToCacheList([
          { url: '/example.html' },
          { url: '/example-2.html' },
        ]);

        expect(stub.callCount).to.be.gt(0);
      });

      it(`should not warn developers on prod builds`, async function() {
        process.env.NODE_ENV = 'prod';

        const PrecacheManager = (await import(PRECACHE_MANAGER_PATH)).default;

        const stub = sandbox.stub(console, 'debug');

        const precacheManager = new PrecacheManager();
        precacheManager.addToCacheList([{ url: '/example.html' }]);

        expect(stub.callCount).to.equal(0);
      });

      it(`should remove duplicate object entries`, async function() {
        const PrecacheManager = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheManager = new PrecacheManager();

        const singleObject = { url: '/duplicate.html'};
        const inputObjects = [
          singleObject,
          singleObject,
        ];
        precacheManager.addToCacheList(inputObjects);

        expect(precacheManager._entriesToCacheMap.size).to.equal(1);

        const entry = precacheManager._entriesToCacheMap.get(singleObject.url);
        expect(entry.entryId).to.equal(singleObject.url);
        expect(entry.revision).to.equal(singleObject.url);
        expect(entry.request.url).to.equal(singleObject.url);
      });
    });

    describe(`with objects containing urls and revisions`, function() {
      it(`should add objects to cache entries`, async function() {
        const PrecacheManager = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheManager = new PrecacheManager();

        const inputObjects = [
          { url: '/', revision: '123' },
          { url: '/hello.html', revision: '123' },
          { url: '/styles/hello.css', revision: '123' },
          { url: '/scripts/controllers/hello.js', revision: '123' },
        ];
        precacheManager.addToCacheList(inputObjects);

        expect(precacheManager._entriesToCacheMap.size).to.equal(inputObjects.length);

        inputObjects.forEach((inputObject) => {
          const entry = precacheManager._entriesToCacheMap.get(inputObject.url);
          expect(entry.entryId).to.equal(inputObject.url);
          expect(entry.revision).to.equal(inputObject.revision);
          expect(entry.request.url).to.equal(inputObject.url);
        });
      });

      it(`should not warn developers`, async function() {
        process.env.NODE_ENV = 'dev';

        const PrecacheManager = (await import(PRECACHE_MANAGER_PATH)).default;

        const stub = sandbox.stub(console, 'debug');

        const precacheManager = new PrecacheManager();
        precacheManager.addToCacheList([{ url: '/example.html', revision: '123' }]);

        expect(stub.callCount).to.equals(0);
      });

      it(`should remove duplicate object entries`, async function() {
        const PrecacheManager = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheManager = new PrecacheManager();

        const singleObject = { url: '/duplicate.html', revision: '123' };
        const inputObjects = [
          singleObject,
          singleObject,
        ];
        precacheManager.addToCacheList(inputObjects);

        expect(precacheManager._entriesToCacheMap.size).to.equal(1);

        const entry = precacheManager._entriesToCacheMap.get(singleObject.url);
        expect(entry.entryId).to.equal(singleObject.url);
        expect(entry.revision).to.equal(singleObject.revision);
        expect(entry.request.url).to.equal(singleObject.url);
      });

      it(`should throw on duplicate URL's with different revisions`, async function() {
        const PrecacheManager = (await import(PRECACHE_MANAGER_PATH)).default;
        // TODO Check it's a workbox error with correct error name.
        expect(() => {
          const precacheManager = new PrecacheManager();
          const inputObjects = [
            { url: '/duplicate.html', revision: '123' },
            { url: '/duplicate.html', revision: '456' },
          ];
          precacheManager.addToCacheList(inputObjects);
        }).to.throw();
      });
    });
  });
});
