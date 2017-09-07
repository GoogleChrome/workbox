import {expect} from 'chai';
import sinon from 'sinon';
import clearRequire from 'clear-require';

import expectError from '../../../../infra/utils/expectError';
import generateTestVariants from '../../../../infra/utils/generate-variant-tests'

// This sets Request mock on the Global scope
import '../../../mocks/Request.mjs';

const PRECACHE_MANAGER_PATH = '../../../../packages/workbox-precaching/controllers/PrecacheController.mjs';

describe(`PrecacheController`, function() {
  const sandbox = sinon.sandbox.create();

  beforeEach(function() {
    process.env.NODE_ENV = 'dev';
    clearRequire.all();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe(`constructor`, function() {
    it(`should construct without any inputs`, async function() {
      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
      expect(() => {
        new PrecacheController();
      }).to.not.throw();
    });
  });

  describe(`addToCacheList() with bad values`, function() {
    describe(`with non-array values`, function() {
      const badTopLevelInputs = [
        {},
        true,
        false,
        123,
        '',
        null,
        undefined
      ];
      generateTestVariants(`should throw when passing in non-array values`, badTopLevelInputs, async (variant) => {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheController = new PrecacheController();
        return expectError(() => {
          precacheController.addToCacheList(variant);
        }, 'not-an-array');
      });

      const badNestedInputs = [
        true,
        false,
        123,
        null,
        undefined,
        [],
        '',
        {},
      ];
      generateTestVariants(`should throw when passing in invalid inputs in the array.`, badNestedInputs, async (variant) => {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheController = new PrecacheController();

        return expectError(() => {
          precacheController.addToCacheList([variant]);
        }, 'add-to-cache-list-unexpected-type', (err) => {
          expect(err.details.entry).to.deep.equal(variant);
        });
      });
    });

    describe(`with strings`, function() {
      it(`should add strings to cache entries`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheController = new PrecacheController();

        const inputUrls = [
          '/',
          '/hello.html',
          '/styles/hello.css',
          '/scripts/controllers/hello.js',
        ];
        precacheController.addToCacheList(inputUrls);

        expect(precacheController._entriesToCacheMap.size).to.equal(inputUrls.length);

        inputUrls.forEach((inputUrl) => {
          const entry = precacheController._entriesToCacheMap.get(inputUrl);
          expect(entry.entryId).to.equal(inputUrl);
          expect(entry.revision).to.equal(inputUrl);
        });
      });

      it(`should warn developers on non-production builds`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;

        const stub = sandbox.stub(console, 'debug');

        const precacheController = new PrecacheController();
        precacheController.addToCacheList(['/example.html']);

        expect(stub.callCount).to.be.gt(0);
      });

      it(`should not-warn developers on non-production builds if 'checkEntryRevisioning' is set to false`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;

        const stub = sandbox.stub(console, 'debug');

        const precacheController = new PrecacheController();
        precacheController.checkEntryRevisioning = false;
        precacheController.addToCacheList(['/example.123.html']);

        expect(stub.callCount).to.equal(0);
      });

      it(`should not warn developers on production builds`, async function() {
        process.env.NODE_ENV = 'production';

        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;

        const stub = sandbox.stub(console, 'debug');

        const precacheController = new PrecacheController();
        precacheController.addToCacheList(['/example.html']);

        expect(stub.callCount).to.equal(0);
      });

      it(`should remove duplicate string entries`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheController = new PrecacheController();

        const url = '/duplicate.html';
        const inputUrls = [
          url,
          url,
        ];
        precacheController.addToCacheList(inputUrls);

        expect(precacheController._entriesToCacheMap.size).to.equal(1);

        const entry = precacheController._entriesToCacheMap.get(url);
        expect(entry.entryId).to.equal(url);
        expect(entry.revision).to.equal(url);
      });
    });

    describe(`with objects containing urls`, function() {
      it(`should add objects to cache entries`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheController = new PrecacheController();

        const inputObjects = [
          { url: '/' },
          { url: '/hello.html' },
          { url: '/styles/hello.css' },
          { url: '/scripts/controllers/hello.js' },
        ];
        precacheController.addToCacheList(inputObjects);

        expect(precacheController._entriesToCacheMap.size).to.equal(inputObjects.length);

        inputObjects.forEach((inputObject) => {
          const entry = precacheController._entriesToCacheMap.get(inputObject.url);
          expect(entry.entryId).to.equal(inputObject.url);
          expect(entry.revision).to.equal(inputObject.url);
        });
      });

      it(`should warn developers on non-production builds`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;

        const stub = sandbox.stub(console, 'debug');

        const precacheController = new PrecacheController();
        precacheController.addToCacheList([
          { url: '/example.html' },
          { url: '/example-2.html' },
        ]);

        expect(stub.callCount).to.be.gt(0);
      });

      it(`should not-warn developers on non-production builds if 'checkEntryRevisioning' is set to false`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;

        const stub = sandbox.stub(console, 'debug');

        const precacheController = new PrecacheController();
        precacheController.checkEntryRevisioning = false;
        precacheController.addToCacheList([
          { url: '/example.123.html' },
          { url: '/example-2.123.html' },
        ]);

        expect(stub.callCount).to.equal(0);
      });

      it(`should not warn developers on production builds`, async function() {
        process.env.NODE_ENV = 'production';

        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;

        const stub = sandbox.stub(console, 'debug');

        const precacheController = new PrecacheController();
        precacheController.addToCacheList([{ url: '/example.html' }]);

        expect(stub.callCount).to.equal(0);
      });

      it(`should remove duplicate object entries`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheController = new PrecacheController();

        const singleObject = { url: '/duplicate.html'};
        const inputObjects = [
          singleObject,
          singleObject,
        ];
        precacheController.addToCacheList(inputObjects);

        expect(precacheController._entriesToCacheMap.size).to.equal(1);

        const entry = precacheController._entriesToCacheMap.get(singleObject.url);
        expect(entry.entryId).to.equal(singleObject.url);
        expect(entry.revision).to.equal(singleObject.url);
      });
    });

    describe(`with objects containing urls and revisions`, function() {
      it(`should add objects to cache entries`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheController = new PrecacheController();

        const inputObjects = [
          { url: '/', revision: '123' },
          { url: '/hello.html', revision: '123' },
          { url: '/styles/hello.css', revision: '123' },
          { url: '/scripts/controllers/hello.js', revision: '123' },
        ];
        precacheController.addToCacheList(inputObjects);

        expect(precacheController._entriesToCacheMap.size).to.equal(inputObjects.length);

        inputObjects.forEach((inputObject) => {
          const entry = precacheController._entriesToCacheMap.get(inputObject.url);
          expect(entry.entryId).to.equal(inputObject.url);
          expect(entry.revision).to.equal(inputObject.revision);
        });
      });

      it(`should not warn developers`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;

        const stub = sandbox.stub(console, 'debug');

        const precacheController = new PrecacheController();
        precacheController.addToCacheList([{ url: '/example.html', revision: '123' }]);

        expect(stub.callCount).to.equals(0);
      });

      it(`should remove duplicate object entries`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheController = new PrecacheController();

        const singleObject = { url: '/duplicate.html', revision: '123' };
        const inputObjects = [
          singleObject,
          singleObject,
        ];
        precacheController.addToCacheList(inputObjects);

        expect(precacheController._entriesToCacheMap.size).to.equal(1);

        const entry = precacheController._entriesToCacheMap.get(singleObject.url);
        expect(entry.entryId).to.equal(singleObject.url);
        expect(entry.revision).to.equal(singleObject.revision);
      });

      it(`should throw on conflicting entries with different revisions`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
        const firstEntry = { url: '/duplicate.html', revision: '123' };
        const secondEntry = { url: '/duplicate.html', revision: '456' };
        return expectError(() => {
          const precacheController = new PrecacheController();
          const inputObjects = [
            firstEntry,
            secondEntry,
          ];
          precacheController.addToCacheList(inputObjects);
        }, 'add-to-cache-list-conflicting-entries', (err) => {
          expect(err.details.firstEntry).to.deep.equal(firstEntry);
          expect(err.details.secondEntry).to.deep.equal(secondEntry);
        });
      });
    });
  });
});
