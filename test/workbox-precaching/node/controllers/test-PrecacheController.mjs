import {expect} from 'chai';
import sinon from 'sinon';
import clearRequire from 'clear-require';

import expectError from '../../../../infra/utils/expectError';
import generateTestVariants from '../../../../infra/utils/generate-variant-tests'

import makeServiceWorkerEnv from 'service-worker-mock';

const PRECACHE_MANAGER_PATH = '../../../../packages/workbox-precaching/controllers/PrecacheController.mjs';

describe(`PrecacheController`, function() {
  const sandbox = sinon.sandbox.create();

  before(function() {
    Object.assign(global, makeServiceWorkerEnv());
  });

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

  describe(`addToCacheList()`, function() {
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

    const unrevisionedEntryGroups = {
      'string entries': [
        '/',
        '/hello.html',
        '/styles/hello.css',
        '/scripts/controllers/hello.js',
      ],
      'url only object entries': [
        { url: '/' },
        { url: '/hello.html' },
        { url: '/styles/hello.css' },
        { url: '/scripts/controllers/hello.js' },
      ]
    };

    Object.keys(unrevisionedEntryGroups).map((groupName) => {
      const inputGroup = unrevisionedEntryGroups[groupName];

      it(`should add ${groupName} to cache list`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheController = new PrecacheController();

        const warnStub = sandbox.stub(console, 'warn');
        const debugStub = sandbox.stub(console, 'debug');
        const logStub = sandbox.stub(console, 'log');

        precacheController.addToCacheList(inputGroup);

        sandbox.restore();

        expect(precacheController._entriesToCacheMap.size).to.equal(inputGroup.length);

        inputGroup.forEach((inputValue) => {
          const urlValue = inputValue.url || inputValue;

          const entry = precacheController._entriesToCacheMap.get(urlValue);
          expect(entry._entryId).to.equal(urlValue);
          expect(entry._revision).to.equal(urlValue);
        });

        // Should warn developers on non-production builds.
        expect(warnStub.callCount).to.be.gt(0);
        expect(debugStub.callCount).to.be.gt(0);
        expect(logStub.callCount).to.be.gt(0);
      });

      it(`should not warn developers on non-production builds with ${groupName} if 'checkEntryRevisioning' is set to false`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheController = new PrecacheController();

        const warnStub = sandbox.stub(console, 'warn');
        const debugStub = sandbox.stub(console, 'debug');
        const logStub = sandbox.stub(console, 'log');

        precacheController.checkEntryRevisioning = false;
        precacheController.addToCacheList(inputGroup);

        sandbox.restore();

        expect(warnStub.callCount).to.equal(0);
        expect(debugStub.callCount).to.equal(0);
        expect(logStub.callCount).to.equal(0);
      });

      it(`should not warn developers on production builds with string entries`, async function() {
        process.env.NODE_ENV = 'production';
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheController = new PrecacheController();

        const warnStub = sandbox.stub(console, 'warn');
        const debugStub = sandbox.stub(console, 'debug');
        const logStub = sandbox.stub(console, 'log');

        precacheController.addToCacheList(['/example.html']);

        expect(warnStub.callCount).to.equal(0);
        expect(debugStub.callCount).to.equal(0);
        expect(logStub.callCount).to.equal(0);
      });

      it(`should remove duplicate ${groupName}`, async function() {
        const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;
        const precacheController = new PrecacheController();

        const inputUrls = [
          ...inputGroup,
          ...inputGroup,
        ];

        // Prevent logs in the mocha output
        sandbox.stub(console, 'warn');
        sandbox.stub(console, 'debug');
        sandbox.stub(console, 'log');

        precacheController.addToCacheList(inputUrls);

        sandbox.restore();

        expect(precacheController._entriesToCacheMap.size).to.equal(inputGroup.length);

        inputGroup.forEach((inputValue) => {
          const urlValue = inputValue.url || inputValue;

          const entry = precacheController._entriesToCacheMap.get(urlValue);
          expect(entry._entryId).to.equal(urlValue);
          expect(entry._revision).to.equal(urlValue);
        });
      });
    });

    it(`should add url + revision objects to cache list`, async function() {
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
        expect(entry._entryId).to.equal(inputObject.url);
        expect(entry._revision).to.equal(inputObject.revision);
      });
    });

    it(`should not warn developers with url + revision objects.`, async function() {
      const PrecacheController = (await import(PRECACHE_MANAGER_PATH)).default;

      const debugStub = sandbox.stub(console, 'debug');
      const logStub = sandbox.stub(console, 'log');

      const precacheController = new PrecacheController();
      precacheController.addToCacheList([{ url: '/example.html', revision: '123' }]);

      expect(debugStub.callCount).to.equal(0);
      expect(logStub.callCount).to.equal(0);
    });

    it(`should remove duplicate url + revision object entries`, async function() {
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
      expect(entry._entryId).to.equal(singleObject.url);
      expect(entry._revision).to.equal(singleObject.revision);
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
