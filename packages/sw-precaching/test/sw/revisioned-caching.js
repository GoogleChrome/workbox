importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');

importScripts('/packages/sw-precaching/build/sw-precaching.min.js');

/* global goog */

const expect = self.chai.expect;
self.chai.should();

mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('sw/revisioned-caching()', function() {
  let cacheManager;

  const VALID_PATH_REL = '/__echo/date/example.txt';
  const VALID_PATH_ABS = `${location.origin}${VALID_PATH_REL}`;
  const VALID_REVISION = '1234';

  beforeEach(function() {
    cacheManager = new goog.precaching.RevisionedCacheManager();
  });

  afterEach(function() {
    cacheManager._close();
    cacheManager = null;
  });

  const badRevisionFileInputs = [
    undefined,
    '',
    '/example.js',
    {},
    {url: 'hello'},
    {revision: '0987'},
    true,
    false,
    123,
    new Request(VALID_PATH_ABS),
    new Request(VALID_PATH_REL),
  ];
  badRevisionFileInputs.forEach((badInput) => {
    it(`should handle bad cacheRevisioned({revisionedFiles='${badInput}'}) input`, function() {
      expect(() => {
        cacheManager.addToCacheList({
          revisionedFiles: badInput,
        });
      }).to.throw('instance of \'Array\'');
    });

    it(`should handle bad cacheRevisioned('${badInput}') input`, function() {
      expect(() => {
        cacheManager.addToCacheList(badInput);
      }).to.throw('instance of \'Array\'');
    });
  });

  it(`should handle bad cacheRevisioned('[]') input`, function() {
    expect(() => {
      cacheManager.addToCacheList([]);
    }).to.throw('instance of \'Array\'');
  });

  it(`should handle cacheRevisioned(null / undefined) inputs`, function() {
    expect(() => {
      cacheManager.addToCacheList({revisionedFiles: null});
    }).to.throw('instance of \'Array\'');

    expect(() => {
      cacheManager.addToCacheList(null);
    }).to.throw('null');
  });

  const badPaths = [
    null,
    undefined,
    false,
    true,
    12345,
    {},
    [],
  ];

  const badRevisions = [
    null,
    undefined,
    false,
    true,
    '',
    12345,
    {},
    [],
  ];

  const badFileManifests = [];
  badPaths.forEach((badPath) => {
    badFileManifests.push([badPath]);
    badFileManifests.push([{url: badPath, revision: VALID_REVISION}]);
  });
  badRevisions.forEach((badRevision) => {
    badFileManifests.push([{url: VALID_PATH_REL, revision: badRevision}]);
  });

  badFileManifests.forEach((badFileManifest) => {
    it(`should throw an errror for bad url / revision value '${JSON.stringify(badFileManifest)}'`, function() {
      let caughtError;
      try {
        cacheManager.addToCacheList({revisionedFiles: badFileManifest});
      } catch (err) {
        caughtError = err;
      }

      if (!caughtError) {
        throw new Error('Expected file manifest to cause an error.');
      }
      // TODO: Changed assertion library to support throwing custom errors.
      // caughtError.name.should.equal('invalid-revisioned-entry');
    });
  });

  const badCacheBusts = [
    null,
    '',
    '1234sgdgh',
    12345,
    {},
    [],
  ];

  badCacheBusts.forEach((badCacheBust) => {
    it(`should be able to handle bad cacheBust value '${JSON.stringify(badCacheBust)}'`, function() {
      let caughtError;
      try {
        cacheManager.addToCacheList({revisionedFiles: [
          {url: VALID_PATH_REL, revision: VALID_REVISION, cacheBust: badCacheBust},
        ]});
      } catch (err) {
        caughtError = err;
      }

      if (!caughtError) {
        throw new Error('Expected file manifest to cause an error.');
      }

      // TODO: Move assertion library over to custom errors.
      // caughtError.name.should.equal('invalid-revisioned-entry');
    });
  });

  const goodManifestInputs = [
    VALID_PATH_REL,
    {url: VALID_PATH_REL, revision: VALID_REVISION},
    {url: VALID_PATH_REL, revision: VALID_REVISION, cacheBust: true},
    {url: VALID_PATH_REL, revision: VALID_REVISION, cacheBust: false},
    VALID_PATH_ABS,
    {url: VALID_PATH_ABS, revision: VALID_REVISION},
    {url: VALID_PATH_ABS, revision: VALID_REVISION, cacheBust: true},
    {url: VALID_PATH_ABS, revision: VALID_REVISION, cacheBust: false},
  ];
  goodManifestInputs.forEach((goodInput) => {
    it(`should be able to handle good cache input '${JSON.stringify(goodInput)}'`, function() {
      cacheManager.addToCacheList({revisionedFiles: [goodInput]});
    });
  });

  it('should throw error when precaching the same path but different revision', function() {
    const TEST_PATH = '/__echo/date/hello.txt';
    let thrownError = null;
    try {
      cacheManager.addToCacheList({revisionedFiles: [
        {url: TEST_PATH, revision: '1234'},
      ]});
      cacheManager.addToCacheList({revisionedFiles: [
        {url: TEST_PATH, revision: '5678'},
      ]});
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    thrownError.name.should.equal('duplicate-entry-diff-revisions');
  });
});
