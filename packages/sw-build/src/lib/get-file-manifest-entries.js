const errors = require('./errors');
const filterFiles = require('./utils/filter-files');
const getCompositeDetails = require('./utils/get-composite-details');
const getFileDetails = require('./utils/get-file-details');
const getStringDetails = require('./utils/get-string-details');

/**
 * @typedef {Object} ManifestEntry
 * @property {String} url The URL to the asset in the manifest.
 * @property {String} revision The revision details for the file. This is a
 * hash generated by node based on the file contents.
 * @memberof module:sw-build
 */


/**
 * To get a list of files and revision details that can be used to ultimately
 * precache assets in a service worker.
 *
 * @param {Object} input
 * @param {Array<String>} input.staticFileGlobs Patterns used to select files to
 * include in the file entries.
 * @param {Array<String>} [input.globIgnores] Patterns used to exclude files
 * from the file entries.
 * @param {String} input.globDirectory The directory run the glob patterns over.
 * @param {Object<String,Array|String>} [input.templatedUrls]
 * If a URL is rendered/templated on the server, its contents may not depend on
 * a single file. This maps URLs to a list of file names, or to a string
 * value, that uniquely determines each URL's contents.
 * @param {number} [input.maximumFileSizeToCacheInBytes] An optional number to
 * define the maximum file size to consider whether the file should be
 * precached. (Defaults to 2MB).
 * @param {RegExp} [input.dontCacheBustUrlsMatching] An optional regex that will
 * return a URL string and exclude the revision details for urls matching this
 * regex. Useful if you have assets with file revisions in the URL.
 * @return {Array<ManifestEntry>} An array of ManifestEntries will include
 * a url and revision details for each file found.
 * @memberof module:sw-build
 */
const getFileManifestEntries = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error(errors['invalid-get-manifest-entries-input']);
  }

  const staticFileGlobs = input.staticFileGlobs;
  const globIgnores = input.globIgnores ? input.globIgnores : [];
  const globDirectory = input.globDirectory;
  // dynamicUrlToDependencies is for sw-precaching parity / migration.
  const templatedUrls = input.templatedUrls || input.dynamicUrlToDependencies;

  if (typeof globDirectory !== 'string' || globDirectory.length === 0) {
    return Promise.reject(
      new Error(errors['invalid-glob-directory']));
  }

  if (!staticFileGlobs || !Array.isArray(staticFileGlobs)) {
    return Promise.reject(
      new Error(errors['invalid-static-file-globs']));
  }

  if (!globIgnores || !Array.isArray(globIgnores)) {
    return Promise.reject(
      new Error(errors['invalid-glob-ignores']));
  }

  // templatedUrls is optional.
  if (templatedUrls && (
      typeof templatedUrls !== 'object' || Array.isArray(templatedUrls))) {
      return Promise.reject(new Error(errors['invalid-templated-urls']));
  }

  let validIgnores = true;
  globIgnores.forEach((pattern) => {
    if (typeof pattern !== 'string') {
      validIgnores = false;
    }
  });
  if (!validIgnores) {
    return Promise.reject(
      new Error(errors['invalid-glob-ignores']));
  }

  const fileSet = new Set();

  const fileDetails = staticFileGlobs.reduce((accumulated, globPattern) => {
    const globbedFileDetails = getFileDetails(
      globDirectory, globPattern, globIgnores);
    globbedFileDetails.forEach((fileDetails) => {
      if (fileSet.has(fileDetails.file)) {
        return;
      }

      fileSet.add(fileDetails.file);
      accumulated.push(fileDetails);
    });
    return accumulated;
  }, []);

  // templatedUrls is optional.
  if (templatedUrls) {
    for (let url of Object.keys(templatedUrls)) {
      if (fileSet.has(url)) {
        return Promise.reject(
          new Error(errors['templated-url-matches-glob']));
      }

      const dependencies = templatedUrls[url];
      if (Array.isArray(dependencies)) {
        const dependencyDetails = dependencies.reduce((previous, pattern) => {
          try {
            const globbedFileDetails = getFileDetails(
              globDirectory, pattern, globIgnores);
            return previous.concat(globbedFileDetails);
          } catch (err) {
            const debugObj = {};
            debugObj[url] = dependencies;
            throw new Error(`${errors['bad-template-urls-asset']} ` +
              `'${pattern}' in templateUrl '${JSON.stringify(debugObj)}' ` +
              `could not be found.`);
          }
        }, []);
        fileDetails.push(getCompositeDetails(url, dependencyDetails));
      } else if (typeof dependencies === 'string') {
        fileDetails.push(getStringDetails(url, dependencies));
      } else {
        return Promise.reject(
          new Error(errors['invalid-templated-urls']));
      }
    }
  }

  return Promise.resolve(filterFiles(fileDetails, input));
};

module.exports = getFileManifestEntries;
