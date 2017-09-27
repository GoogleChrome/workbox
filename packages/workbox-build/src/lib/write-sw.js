const fse = require('fs-extra');
const path = require('path');
const template = require('lodash.template');

const errors = require('./errors');
const runtimeCachingConverter = require('./utils/runtime-caching-converter');

module.exports = async (swDest, manifestEntries,
                        pathToWorkboxSWFileRelativeToDest,
                        globDirectory, options = {}) => {
  try {
    await fse.mkdirp(path.dirname(swDest));
  } catch (error) {
    throw new Error(`${errors['unable-to-make-sw-directory']}. ` +
      `'${error.message}'`);
  }

  const templatePath = path.join(__dirname, 'templates', 'sw.js.tmpl');
  let templateString;
  try {
    templateString = await fse.readFile(templatePath, 'utf8');
  } catch (error) {
    throw new Error(`${errors['read-sw-template-failure']}. ` +
      `'${error.message}'`);
  }
  const workboxSWOptions = {};
  if (options.cacheId) {
    workboxSWOptions.cacheId = options.cacheId;
  }
  if (options.skipWaiting) {
    workboxSWOptions.skipWaiting = true;
  }
  if (options.handleFetch === false) {
    workboxSWOptions.handleFetch = false;
  }
  if (options.clientsClaim) {
    workboxSWOptions.clientsClaim = true;
  }
  if (options.directoryIndex) {
    workboxSWOptions.directoryIndex = options.directoryIndex;
  }
  if (options.ignoreUrlParametersMatching) {
    // JSON.stringify can't output regexes so instead we'll
    // inject it in the workboxSWOptionsString.
    workboxSWOptions.ignoreUrlParametersMatching = [];
  }

  const runtimeCaching = runtimeCachingConverter(options.runtimeCaching);

  let populatedTemplate;
  try {
    let workboxSWOptionsString = '';
    if (Object.keys(workboxSWOptions).length > 0) {
      workboxSWOptionsString = JSON.stringify(workboxSWOptions, null, 2);
    }
    if (options.ignoreUrlParametersMatching) {
      workboxSWOptionsString = workboxSWOptionsString.replace(
        '"ignoreUrlParametersMatching": []',
        `"ignoreUrlParametersMatching": [` +
            options.ignoreUrlParametersMatching.join(', ') + `]`
      );
    }
    populatedTemplate = template(templateString)({
      manifestEntries: manifestEntries,
      workboxSWImportPath: pathToWorkboxSWFileRelativeToDest,
      navigateFallback: options.navigateFallback,
      navigateFallbackWhitelist: options.navigateFallbackWhitelist,
      workboxSWOptionsString,
      runtimeCaching,
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
