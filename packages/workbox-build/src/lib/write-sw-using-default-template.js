const fse = require('fs-extra');
const path = require('path');

const errors = require('./errors');
const populateSWTemplate = require('./populate-sw-template');

module.exports = async ({
  cacheId,
  clientsClaim,
  directoryIndex,
  handleFetch,
  ignoreUrlParametersMatching,
  importScripts,
  manifestEntries,
  navigateFallback,
  navigateFallbackWhitelist,
  runtimeCaching,
  skipWaiting,
  swDest,
}) => {
  try {
    await fse.mkdirp(path.dirname(swDest));
  } catch (error) {
    throw new Error(`${errors['unable-to-make-sw-directory']}. ` +
      `'${error.message}'`);
  }

  const populatedTemplate = populateSWTemplate({
    cacheId,
    clientsClaim,
    directoryIndex,
    handleFetch,
    ignoreUrlParametersMatching,
    importScripts,
    manifestEntries,
    navigateFallback,
    navigateFallbackWhitelist,
    runtimeCaching,
    skipWaiting,
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
