'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const getFileManifestEntries = require('./get-file-manifest-entries');
const errors = require('./errors');

/**
 * This method will read an existing service worker file and replace an empty
 * precache() call, like: `.precache([])`, and replace the array with
 * an array of assets to precache. This allows the service worker
 * to efficiently cache assets for offline use.
 *
 * @param {Object} input
 * @param {String} input.swSrc File path and name of the service worker file
 * to read and inject the manifest into before writing to `swDest`.
 * @param {String} input.swDest The file path and name you wish to writh the
 * service worker file to.
 * @param {String} input.globDirectory The directory you wish to run the
 * `globPatterns` against.
 * @param {Array<String>} input.globPatterns Files matching against any of
 * these glob patterns will be included in the file manifest.
 *
 * Defaults to ['**\/*.{js,css}']
 * @param {String|Array<String>} [input.globIgnores] Files matching against any
 * of these glob patterns will be excluded from the file manifest, even if the
 * file matches against a `globPatterns` pattern.
 * @param {Object<String,Array|String>} [input.templatedUrls]
 * If a URL is rendered with templates on the server, its contents may
 * depend on multiple files. This maps URLs to an array of file names, or to a
 * string value, that uniquely determines the URL's contents.
 * @param {String} [input.modifyUrlPrefix] An object of key value pairs
 * where URL's starting with the key value will be replaced with the
 * corresponding value.
 * @param {number} [input.maximumFileSizeToCacheInBytes] This value can be used
 * to determine the maximum size of files that will be precached.
 *
 * Defaults to 2MB.
 * @param {RegExp} [input.dontCacheBustUrlsMatching] An optional regex that will
 * return a URL string and exclude the revision details for urls matching this
 * regex. Useful if you have assets with file revisions in the URL.
 * @param {Array<ManifestTransform>} [input.manifestTransforms] A list of
 * manifest transformations, which will be applied sequentially against the
 * generated manifest. If `modifyUrlPrefix` or `dontCacheBustUrlsMatching` are
 * also specified, their corresponding transformations will be applied first.
 * @return {Promise} Resolves once the service worker has been written
 * with the injected precache list.
 *
 * @example <caption>Generate a build manifest of static assets, which could
 * then be used with a service worker.</caption>
 * const swBuild = require('workbox-build');
 *
 * swBuild.injectManifest({
 *   globDirectory: './build/',
 *   globPatterns: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html'],
 *   swSrc: './src/sw.js',
 *   swDest: './build/sw.js',
 * })
 * .then(() => {
 *   console.log('Build Manifest generated.');
 * });
 *
 * @memberof module:workbox-build
 */
const injectManifest = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return Promise.reject(
      new Error(errors['invalid-inject-manifest-arg']));
  }

  const injectionPointRegex = /(\.precache\()\s*\[\s*\]\s*(\))/g;

  return getFileManifestEntries(input)
  .then((manifestEntries) => {
    let swFileContents = fs.readFileSync(input.swSrc, 'utf8');
    const injectionResults = swFileContents.match(injectionPointRegex);
    if (!injectionResults) {
      throw new Error(errors['injection-point-not-found']);
    }

    if (injectionResults.length > 1) {
      throw new Error(errors['multiple-injection-points-found']);
    }

    const entriesString = JSON.stringify(manifestEntries, null, 2);
    swFileContents = swFileContents
      .replace(injectionPointRegex, `$1${entriesString}$2`);

    return new Promise((resolve, reject) => {
      mkdirp(path.dirname(input.swDest), (err) => {
        if (err) {
          return reject(
            new Error(
              errors['unable-to-make-injection-directory'] +
              ` '${err.message}'`
            )
          );
        }
        resolve();
      });
    })
    .then(() => {
      fs.writeFileSync(input.swDest, swFileContents);
    });
  });
};

module.exports = injectManifest;
