/*
  Copyright 2017 Google Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const path = require('path');

const GenerateSWOptions = require('./options/generate-sw-options');
const copyWorkboxSW = require('../lib/copy-workbox-sw');
const getFileManifestEntries = require('../lib/get-file-manifest-entries');
const useBuildType = require('../lib/use-build-type');
const writeServiceWorkerUsingDefaultTemplate =
  require('../lib/write-sw-using-default-template');

// TODO: Change to official CDN URL.
const CDN_URL = `https://unpkg.com/workbox-sw@2.0.3/build/importScripts/` +
  `workbox-sw.prod.v2.0.3.js`;

/**
 * This method creates a list of URLs to precache, referred to as a "precache
 * manifest", based on the options you provide.
 *
 * It also takes in additional options that configures the service worker's
 * behavior, like any `runtimeCaching` rules it should use.
 *
 * Based on the precache manifest and the additional configuration, it writes
 * a ready-to-use service worker file to disk at `swDest`.
 *
 * @param {Object} input
 * @return {Promise<{count: Number, size: Number}>} A promise that resolves once
 * the service worker file has been written to `swDest`. The `size` property
 * contains the aggregate size of all the precached entries, in bytes, and the
 * `count` property contains the total number of precached entries.
 *
 * @memberof module:workbox-build
 */
async function generateSW(input) {
  const options = new GenerateSWOptions(input);

  const destDirectory = path.dirname(options.swDest);
  // This will cause the dev build of WorkboxSW (either from the CDN or locally
  // copying it) to be used if NODE_ENV starts with 'dev'.
  const buildType = (process.env.NODE_ENV &&
    process.env.NODE_ENV.startsWith('dev')) ? 'dev' : 'prod';

  if (options.importWorkboxFromCDN) {
    const cdnUrl = useBuildType(CDN_URL, buildType);
    // importScripts may or may not already be an array containing other URLs.
    options.importScripts = (options.importScripts || []).concat(cdnUrl);
  } else {
    // If we're not importing the Workbox script from the CDN, copy it over.
    const pathToWorkboxSWFile = await copyWorkboxSW(destDirectory, buildType);

    // If we're writing our SW file to build/sw.js, the workbox-sw file will be
    // build/workbox-sw.js. So the sw.js file should import workboxSW.***.js
    // (i.e. not include build/).
    const pathToWorkboxSWFileRelativeToDest = path.relative(destDirectory,
      pathToWorkboxSWFile);

    // Add a few extra ignore rules to whatever might be specified to avoid
    // picking up the generated service worker or the workbox-sw files.
    options.globIgnores = [
      path.basename(pathToWorkboxSWFileRelativeToDest),
      `${path.basename(pathToWorkboxSWFileRelativeToDest)}.map`,
    ].map((file) => `**/${file}`).concat(options.globIgnores);

    // importScripts may or may not already be an array containing other URLs.
    options.importScripts = (options.importScripts || []).concat(
      pathToWorkboxSWFileRelativeToDest);
  }

  const {count, size, manifestEntries} = await getFileManifestEntries(options);

  await writeServiceWorkerUsingDefaultTemplate(Object.assign({
    manifestEntries,
  }, options));

  return {count, size};
}

module.exports = generateSW;
