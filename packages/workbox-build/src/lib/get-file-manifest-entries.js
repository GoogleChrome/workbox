/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const assert = require('assert');
const path = require('path');

const errors = require('./errors');
const filterFiles = require('./filter-files');
const getCompositeDetails = require('./get-composite-details');
const getFileDetails = require('./get-file-details');
const getStringDetails = require('./get-string-details');

module.exports = async ({
  dontCacheBustURLsMatching,
  globDirectory,
  globFollow,
  globIgnores,
  globPatterns,
  globStrict,
  manifestTransforms,
  maximumFileSizeToCacheInBytes,
  modifyURLPrefix,
  swDest,
  templatedURLs,
}) => {
  const warnings = [];
  // Initialize to an empty array so that we can still pass something to
  // filterFiles() and get a normalized output.
  let fileDetails = [];
  const fileSet = new Set();

  if (globDirectory) {
    if (swDest) {
      // Ensure that we ignore the SW file we're eventually writing to disk.
      globIgnores.push(`**/${path.basename(swDest)}`);
    }

    try {
      fileDetails = globPatterns.reduce((accumulated, globPattern) => {
        const globbedFileDetails = getFileDetails({
          globDirectory,
          globFollow,
          globIgnores,
          globPattern,
          globStrict,
        });

        globbedFileDetails.forEach((fileDetails) => {
          if (fileSet.has(fileDetails.file)) {
            return;
          }

          fileSet.add(fileDetails.file);
          accumulated.push(fileDetails);
        });
        return accumulated;
      }, []);
    } catch (error) {
      // If there's an exception thrown while globbing, then report
      // it back as a warning, and don't consider it fatal.
      warnings.push(error.message);
    }
  }

  if (templatedURLs) {
    for (let url of Object.keys(templatedURLs)) {
      assert(!fileSet.has(url), errors['templated-url-matches-glob']);

      const dependencies = templatedURLs[url];
      if (Array.isArray(dependencies)) {
        const details = dependencies.reduce((previous, globPattern) => {
          try {
            const globbedFileDetails = getFileDetails({
              globDirectory,
              globFollow,
              globIgnores,
              globPattern,
              globStrict,
            });
            return previous.concat(globbedFileDetails);
          } catch (error) {
            const debugObj = {};
            debugObj[url] = dependencies;
            throw new Error(`${errors['bad-template-urls-asset']} ` +
              `'${globPattern}' from '${JSON.stringify(debugObj)}':\n` +
              error);
          }
        }, []);
        fileDetails.push(getCompositeDetails(url, details));
      } else if (typeof dependencies === 'string') {
        fileDetails.push(getStringDetails(url, dependencies));
      }
    }
  }

  const filteredFiles = filterFiles({fileDetails,
    maximumFileSizeToCacheInBytes, modifyURLPrefix, dontCacheBustURLsMatching,
    manifestTransforms});

  if (warnings.length > 0) {
    filteredFiles.warnings.push(...warnings);
  }

  return filteredFiles;
};
