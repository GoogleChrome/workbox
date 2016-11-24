/* global goog */
importScripts('/packages/sw-precaching/test/browser-unit/data/test-data.js');
importScripts('/packages/sw-precaching/build/sw-precaching.min.js');

const revisionedCacheManager = new goog.precaching.RevisionedCacheManager();
revisionedCacheManager.cache({revisionedFiles: goog.__TEST_DATA.EXAMPLE_REVISIONED_FILES});
