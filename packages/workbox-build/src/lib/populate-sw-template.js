const template = require('lodash.template');
const swTemplate = require('../templates/sw-template');

const errors = require('./errors');
const runtimeCachingConverter = require('./runtime-caching-converter');

module.exports = ({
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
}) => {
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

  let workboxOptionsString = JSON.stringify(workboxOptions, null, 2);
  if (ignoreUrlParametersMatching) {
    workboxOptionsString = workboxOptionsString.replace(
      `"ignoreUrlParametersMatching": []`,
      `"ignoreUrlParametersMatching": [` +
      `${ignoreUrlParametersMatching.join(', ')}]`
    );
  }

  try {
    return template(swTemplate)({
      importScripts,
      manifestEntries,
      navigateFallback,
      navigateFallbackWhitelist,
      workboxOptionsString,
      runtimeCaching: runtimeCachingConverter(runtimeCaching),
    }).trim() + '\n';
  } catch (error) {
    throw new Error(
      `${errors['populating-sw-tmpl-failed']} '${error.message}'`);
  }
};
