importScripts('/node_modules/mocha/mocha.js');
importScripts('/node_modules/chai/chai.js');
importScripts('/node_modules/sw-testing-helpers/build/browser/mocha-utils.js');

importScripts('/packages/sw-precaching/build/sw-precaching.min.js');

/* global goog */

self.chai.should();
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test Cookies with Precache', function() {
  it('should cache asset with appropriate cookies with revisions asset', function() {
    const precacheManager = new goog.precaching.PrecacheManager();
    precacheManager.cacheRevisioned({
      revisionedFiles: [
        `/__test/cookie/1/`,
      ],
    });
    precacheManager.cacheUnrevisioned({
      unrevisionedFiles: [
        `/__test/cookie/2/`,
      ],
    });

    return precacheManager._performInstallStep()
    .then(() => {
      precacheManager._performActivateStep();
    })
    .then(() => {
      return Promise.all([
        caches.match(`/__test/cookie/1/`),
        caches.match(`/__test/cookie/2/`),
      ]);
    })
    .then((responses) => {
      // The /__test/cookie/ endpoint simply returns a request body
      // of all the cookies as JSON so we should be able to see the
      // swtesting cookie.
      return Promise.all(responses.map((response) => response.json()));
    })
    .then((responses) => {
      responses.forEach((response) => {
        if(!response.swtesting) {
          throw new Error(`The 'swtesting' cookie was not found.`);
        }
      });
    });
  });
});
