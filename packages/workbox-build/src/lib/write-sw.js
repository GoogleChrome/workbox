'use strict';

const errors = require('./errors');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const runtimeCachingConverter = require('./utils/runtime-caching-converter');
const template = require('lodash.template');

module.exports =
  (swDest, manifestEntries, workboxSWImportPath, globDirectory, options) => {
  options = options || {};
  try {
    mkdirp.sync(path.dirname(swDest));
  } catch (err) {
    return Promise.reject(
      new Error(`${errors['unable-to-make-sw-directory']}. '${err.message}'`)
    );
  }

  const templatePath = path.join(
    __dirname, '..', 'lib', 'templates', 'sw.js.tmpl');
  return new Promise((resolve, reject) => {
    fs.readFile(templatePath, 'utf8', (err, data) => {
      if (err) {
        return reject(
          new Error(`${errors['read-sw-template-failure']}. '${err.message}'`)
        );
      }
      resolve(data);
    });
  })
  .then((templateString) => {
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
      return template(templateString)({
        manifestEntries: manifestEntries,
        workboxSWImportPath,
        navigateFallback: options.navigateFallback,
        navigateFallbackWhitelist: options.navigateFallbackWhitelist,
        workboxSWOptionsString,
        runtimeCaching,
      }).trim() + '\n';
    } catch (err) {
      throw new Error(
        `${errors['populating-sw-tmpl-failed']}. '${err.message}'`);
    }
  })
  .then((populatedTemplate) => {
    return new Promise((resolve, reject) => {
      fs.writeFile(swDest, populatedTemplate, (error) => {
        if (error) {
          if (error.code === 'EISDIR') {
            // See https://github.com/GoogleChrome/workbox/issues/612
            return reject(new Error(errors['sw-write-failure-directory']));
          }
          return reject(new Error(
            `${errors['sw-write-failure']}. '${error.message}'`));
        }

        resolve();
      });
    });
  });
};
