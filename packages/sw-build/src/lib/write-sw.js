const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const template = require('lodash.template');

const errors = require('./errors');

module.exports =
  (swSrc, manifestEntries, swlibPath, rootDirectory, options) => {
  options = options || {};
  try {
    mkdirp.sync(path.dirname(swSrc));
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
    const relSwlibPath = path.relative(rootDirectory, swlibPath);

    const swlibOptions = {};
    if (options.cacheId) {
      swlibOptions.cacheId = options.cacheId;
    }
    if (options.skipWaiting) {
      swlibOptions.skipWaiting = true;
    }
    if (options.handleFetch === false) {
      swlibOptions.handleFetch = false;
    }
    if (options.clientsClaim) {
      swlibOptions.clientsClaim = true;
    }
    if (options.directoryIndex) {
      swlibOptions.directoryIndex = options.directoryIndex;
    }
    let runtimeCaching = [];
    if (options.runtimeCaching) {
      options.runtimeCaching.forEach((cachingEntry) => {
        if (typeof cachingEntry.handler === 'string') {
          let handlerName = cachingEntry.handler === 'fastest' ?
            'staleWhileRevalidate' : cachingEntry.handler;
          let optionsString = cachingEntry.options ?
            JSON.stringify(cachingEntry.options, null, 2) : '';
          let stratString = `swlib.strategies.${handlerName}(${optionsString})`;
          runtimeCaching.push(
            `swlib.router.registerRoute(${cachingEntry.urlPattern}, ` +
            `${stratString});`
          );
        } else if (typeof cachingEntry.handler === 'function') {
          let handlerString = cachingEntry.handler.toString();
          runtimeCaching.push(
            `swlib.router.registerRoute(${cachingEntry.urlPattern}, ` +
            `${handlerString});`
          );
        }
      });
    }

    try {
      return template(templateString)({
        manifestEntries: manifestEntries,
        swlibPath: relSwlibPath,
        navigateFallback: options.navigateFallback,
        navigateFallbackWhitelist: options.navigateFallbackWhitelist,
        swlibOptions,
        runtimeCaching,
      }).trim() + '\n';
    } catch (err) {
      throw new Error(
        `${errors['populating-sw-tmpl-failed']}. '${err.message}'`);
    }
  })
  .then((populatedTemplate) => {
    return new Promise((resolve, reject) => {
      fs.writeFile(swSrc, populatedTemplate, (err) => {
        if (err) {
          return reject(
            new Error(`${errors['sw-write-failure']}. '${err.message}'`)
          );
        }

        resolve();
      });
    });
  });
};
