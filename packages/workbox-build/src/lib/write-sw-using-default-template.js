/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const fse = require('fs-extra');
const path = require('path');

const errors = require('./errors');
const populateSWTemplate = require('./populate-sw-template');

module.exports = async ({
  cacheId,
  cleanupOutdatedCaches,
  clientsClaim,
  directoryIndex,
  handleFetch,
  ignoreURLParametersMatching,
  importScripts,
  manifestEntries,
  modulePathPrefix,
  navigateFallback,
  navigateFallbackBlacklist,
  navigateFallbackWhitelist,
  navigationPreload,
  offlineGoogleAnalytics,
  runtimeCaching,
  skipWaiting,
  swDest,
  workboxSWImport,
}) => {
  try {
    await fse.mkdirp(path.dirname(swDest));
  } catch (error) {
    throw new Error(`${errors['unable-to-make-sw-directory']}. ` +
      `'${error.message}'`);
  }

  const populatedTemplate = populateSWTemplate({
    cacheId,
    cleanupOutdatedCaches,
    clientsClaim,
    directoryIndex,
    handleFetch,
    ignoreURLParametersMatching,
    importScripts,
    manifestEntries,
    modulePathPrefix,
    navigateFallback,
    navigateFallbackBlacklist,
    navigateFallbackWhitelist,
    navigationPreload,
    offlineGoogleAnalytics,
    runtimeCaching,
    skipWaiting,
    workboxSWImport,
  });

  try {
    await fse.writeFile(swDest, populatedTemplate);
  } catch (error) {
    if (error.code === 'EISDIR') {
      // See https://github.com/GoogleChrome/workbox/issues/612
      throw new Error(errors['sw-write-failure-directory']);
    }
    throw new Error(`${errors['sw-write-failure']}. '${error.message}'`);
  }
};
