/* global goog */
importScripts('/packages/sw-precaching/test/browser-unit/data/test-data.js');
importScripts('/packages/sw-precaching/build/sw-precaching.min.js');
importScripts('/packages/sw-precaching/test/browser-unit/data/skip-and-claim.js');

const revisionedCacheManager = new goog.precaching.RevisionedCacheManager();
revisionedCacheManager.cache({
  revisionedFiles: goog.__TEST_DATA['404'],
});
