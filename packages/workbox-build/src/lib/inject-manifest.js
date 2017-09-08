'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const getFileManifestEntries = require('./get-file-manifest-entries');
const errors = require('./errors');
const warnAboutConfig = require('./utils/warn-about-config');

// A list of config options that are valid in some contexts, but not when
// using injectManifest().
const INVALID_CONFIG_OPTIONS = [
  'runtimeCaching',
  'navigateFallback',
  'navigateFallbackWhitelist',
];

/**
 * This method will read an existing service worker file, find an instance of
 * `.precache([])`, and replace the empty array with the contents of a precache
 * manifest. This allows the service worker to efficiently cache assets for
 * offline use, while still giving you control over the rest of the service
 * worker's code.
 *
 * @param {module:workbox-build.Configuration} input
 * @return {Promise} Resolves once the service worker has been written
 * with the injected precache list.
 *
 * @example <caption>Takes an existing service worker file that includes
 * a <code>precache([])</code> placeholder, and injects a manifest of discovered
 * assets into it.</caption>
 * const workboxBuild = require('workbox-build');
 *
 * workboxBuild.injectManifest({
 *   swSrc: './dev/sw.js',
 *   swDest: './dist/sw.js',
 *   globDirectory: './dist/',
 *   globPatterns: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html'],
 *   templatedUrls: {
 *     '/shell': ['dev/templates/app-shell.hbs', 'dev/**\/*.css'],
 *   },
 * })
 * .then(() => {
 *   console.log('Service worker generated.');
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

    warnAboutConfig(INVALID_CONFIG_OPTIONS, input, 'injectManifest');

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
