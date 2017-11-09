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

const cdnUtils = require('../lib/cdn-utils');
const copyWorkboxLibraries = require('../lib/copy-workbox-libraries');
const generateSWSchema = require('./options/generate-sw-schema');
const getFileManifestEntries = require('../lib/get-file-manifest-entries');
const validate = require('./options/validate');
const writeServiceWorkerUsingDefaultTemplate =
  require('../lib/write-sw-using-default-template');

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
  const options = validate(input, generateSWSchema);

  const destDirectory = path.dirname(options.swDest);

  if (options.importWorkboxFromCDN) {
    // TODO: Update for https://github.com/GoogleChrome/workbox/issues/969.
    const cdnUrl = cdnUtils.getModuleUrl('workbox-sw', 'prod');
    // importScripts may or may not already be an array containing other URLs.
    // Either way, list cdnUrl first.
    options.importScripts = [cdnUrl].concat(options.importScripts || []);
  } else {
    // If we're not importing the Workbox scripts from the CDN, then copy
    // over the dev + prod version of all of the core libraries.
    const workboxDirectoryName = await copyWorkboxLibraries(destDirectory);

    // The Workbox library files should not be precached, since they're cached
    // automatically by virtue of being used with importScripts().
    options.globIgnores = [
      `**/${workboxDirectoryName}/*.js*`,
    ].concat(options.globIgnores || []);

    const workboxSWPkg = require(`workbox-sw/package.json`);
    // TODO: This will change to workboxSWPkg.main at some point.
    const workboxSWFilename = path.basename(workboxSWPkg.browser);

    // importScripts may or may not already be an array containing other URLs.
    // Either way, list workboxSWFilename first.
    options.importScripts = [
      `${workboxDirectoryName}/${workboxSWFilename}`,
    ].concat(options.importScripts || []);

    options.modulePathPrefix = workboxDirectoryName;
  }

  const {count, size, manifestEntries} = await getFileManifestEntries(options);

  await writeServiceWorkerUsingDefaultTemplate(Object.assign({
    manifestEntries,
  }, options));

  return {count, size};
}

module.exports = generateSW;
