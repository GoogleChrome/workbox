/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const bundle = require('./bundle');
const errors = require('./errors');
const populateSWTemplate = require('./populate-sw-template');

module.exports = async ({
  babelPresetEnvTargets,
  cacheId,
  cleanupOutdatedCaches,
  clientsClaim,
  directoryIndex,
  fileSystem,
  ignoreURLParametersMatching,
  importScripts,
  inlineWorkboxRuntime,
  manifestEntries,
  mode,
  modulePathPrefix,
  navigateFallback,
  navigateFallbackBlacklist,
  navigateFallbackWhitelist,
  navigationPreload,
  offlineGoogleAnalytics,
  runtimeCaching,
  skipWaiting,
  sourcemap,
  swDest,
}) => {
  const unbundledCode = await populateSWTemplate({
    cacheId,
    cleanupOutdatedCaches,
    clientsClaim,
    directoryIndex,
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
  });

  try {
    await bundle({
      babelPresetEnvTargets,
      fileSystem,
      inlineWorkboxRuntime,
      mode,
      sourcemap,
      swDest,
      unbundledCode,
    });
  } catch (error) {
    throw new Error(`${errors['sw-write-failure']}. '${error.message}'`);
  }
};
