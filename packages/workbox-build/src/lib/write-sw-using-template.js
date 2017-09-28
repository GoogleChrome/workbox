const fse = require('fs-extra');
const path = require('path');
const template = require('lodash.template');

const errors = require('./errors');
const runtimeCachingConverter = require('./utils/runtime-caching-converter');

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

  const templatePath = path.join(__dirname, '..', 'templates', 'sw.js.tmpl');
  let templateString;
  try {
    templateString = await fse.readFile(templatePath, 'utf8');
  } catch (error) {
    throw new Error(`${errors['read-sw-template-failure']}. ` +
      `'${error.message}'`);
  }

  // These are all options that can be passed in to the WorkboxSW constructor.
  const workboxOptions = {
    cacheId,
    skipWaiting,
    handleFetch,
    clientsClaim,
    directoryIndex,
    // An array of RegExp objects can't be serialized by JSON.stringify()'s
    // default behavior, so if it's given, convert it manually.
    ignoreUrlParametersMatching: ignoreUrlParametersMatching ?
      [] :
      undefined,
  };
  const workboxOptionsString = JSON.stringify(workboxOptions, null, 2).replace(
    `"ignoreUrlParametersMatching": []`,
    `"ignoreUrlParametersMatching": [` +
      `${ignoreUrlParametersMatching.join(', ')}]`
  );

  let populatedTemplate;
  try {
    populatedTemplate = template(templateString)({
      importScripts,
      manifestEntries,
      navigateFallback,
      navigateFallbackWhitelist,
      workboxOptionsString,
      runtimeCaching: runtimeCachingConverter(runtimeCaching),
    }).trim() + '\n';
  } catch (error) {
    throw new Error(
      `${errors['populating-sw-tmpl-failed']}. '${error.message}'`);
  }

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
