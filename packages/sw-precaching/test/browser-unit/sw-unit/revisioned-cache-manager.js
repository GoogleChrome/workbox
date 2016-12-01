importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/browser/mocha-utils.js');

importScripts('/packages/sw-precaching/build/sw-precaching.min.js');

/* global goog */

const expect = self.chai.expect;
self.chai.should();

mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test RevisionedCacheManager', function() {
  const badRevisionFileInputs = [
    undefined,
    '',
    '/example.js',
    {},
    {path: 'hello'},
    {revision: '0987'},
    true,
    false,
    123,
  ];
  badRevisionFileInputs.forEach((badInput) => {
    it(`should handle bad cache({revisionedFiles='${badInput}'}) input`, function() {
      expect(() => {
        const revisionedCacheManager = new goog.precaching.RevisionedCacheManager();
        revisionedCacheManager.cache({
          revisionedFiles: badInput,
        });
      }).to.throw('instance of \'Array\'');
    });

    it(`should handle bad cache('${badInput}') input`, function() {
      expect(() => {
        const revisionedCacheManager = new goog.precaching.RevisionedCacheManager();
        revisionedCacheManager.cache(badInput);
      }).to.throw('instance of \'Array\'');
    });
  });

  it(`should handle bad cache('[]') input`, function() {
    expect(() => {
      const revisionedCacheManager = new goog.precaching.RevisionedCacheManager();
      revisionedCacheManager.cache([]);
    }).to.throw('instance of \'Array\'');
  });

  it(`should handle null / undefined inputs`, function() {
    expect(() => {
      const revisionedCacheManager = new goog.precaching.RevisionedCacheManager();
      revisionedCacheManager.cache({revisionedFiles: null});
    }).to.throw('instance of \'Array\'');

    expect(() => {
      const revisionedCacheManager = new goog.precaching.RevisionedCacheManager();
      revisionedCacheManager.cache(null);
    }).to.throw('null');
  });

  const VALID_PATH = '/__echo/date/example.txt';
  const VALID_REVISION = '1234';

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
    badFileManifests.push([{path: badPath, revision: VALID_REVISION}]);
  });
  badRevisions.forEach((badRevision) => {
    badFileManifests.push([{path: VALID_PATH, revision: badRevision}]);
  });

  badFileManifests.forEach((badFileManifest) => {
    it(`should throw an errror for a page file manifest entry '${JSON.stringify(badFileManifest)}'`, function() {
      console.log(JSON.stringify({revisionedFiles: badFileManifest}));
      let caughtError;
      try {
        const revisionedCacheManager = new goog.precaching.RevisionedCacheManager();
        revisionedCacheManager.cache({revisionedFiles: badFileManifest});
      } catch (err) {
        caughtError = err;
      }

      if (!caughtError) {
        throw new Error('Expected file manifest to cause an error.');
      }

      caughtError.name.should.equal('invalid-file-manifest-entry');
    });
  });
});
