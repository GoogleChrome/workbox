const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const getFileManifestEntries = require('./get-file-manifest-entries');
const errors = require('./errors');

/**
 * @example <caption>Generate a build manifest of static assets, which could
 * then be used with a service worker.</caption>
 * const swBuild = require('sw-build');
 *
 * swBuild.injectManifest({
 *   dest: './build/'
 *   rootDirectory: './build/',
 *   staticFileGlobs: ['**\/*.{html,js,css}'],
 *   globIgnores: ['admin.html'],
 *   swFile: 'sw.js'
 * })
 * .then(() => {
 *   console.log('Build Manifest generated.');
 * });
 *
 * This method will generate a file manifest that can be used in a service
 * worker for caching assets offline.
 * @param {Object} input
 * @param {String} input.dest The name and path you wish to write your
 * manifest file to.
 * @param {String} input.rootDirectory The root of the files you wish to
 * be cached. This will also be the directory the service worker and library
 * files are written to.
 * @param {Array<String>} input.staticFileGlobs Patterns to glob for when
 * generating the build manifest.
 * @param {String|Array<String>} [input.globIgnores] Patterns to exclude when
 * generating the build manifest.
 * @param {Object<String,Array|String>} [input.templatedUrls]
 * If a URL is rendered/templated on the server, its contents may not depend on
 * a single file. This maps URLs to a list of file names, or to a string
 * value, that uniquely determines each URL's contents.
 * @param {String} input.swFile File name for service worker file to read in
 * and alter.
 * @return {Promise} Resolves once the service worker has been generated
 * with a precache list.
 *
 * @memberof module:sw-build
 */
const injectManifest = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return Promise.reject(
      new Error(errors['invalid-inject-manifest-arg']));
  }

  const injectionPointRegex = /(\.cacheRevisionedAssets\()\s*\[\s*\]\s*(\))/g;

  return getFileManifestEntries(input)
  .then((manifestEntries) => {
    let swFileContents = fs.readFileSync(
      path.join(input.rootDirectory, input.swFile), 'utf8');
    const injectionResult = injectionPointRegex.exec(swFileContents);
    if (!injectionResult) {
      throw new Error(errors['injection-point-not-found']);
    }

    const entriesString = JSON.stringify(manifestEntries, null, 2);
    swFileContents = swFileContents
      .replace(injectionPointRegex, `$1${entriesString}$2`);

    return new Promise((resolve, reject) => {
      mkdirp(input.dest, (err) => {
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
      fs.writeFileSync(path.join(input.dest, input.swFile), swFileContents);
    });
  });
};

module.exports = injectManifest;
