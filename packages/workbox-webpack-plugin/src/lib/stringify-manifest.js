/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const stringify = require('json-stable-stringify');

/**
 * The variable name that workbox-sw expects manifest entries to be assigned.
 * @type {String}
 * @private
 */
const PRECACHE_MANIFEST_VAR = '__precacheManifest';

/**
 * Generates a template string from an array of manifest entries that can be
 * written to a manifest file.
 *
 * @function generateManifestWithWebpack
 * @param {Array<module:workbox-build.ManifestEntry>} manifestEntries
 * @return {string} service worker manifest file string
 *
 * @private
 */
module.exports = (manifestEntries) => {
  const sortedEntries = manifestEntries.sort((a, b) => a.url < b.url);
  // json-stable-stringify ensures that we get a consistent output, with all
  // the properties of each object sorted.
  // There's a hash created of the serialized JSON data, and we want the hash to
  // be the same if the data is the same, without any sort-order variation.
  const entriesJson = stringify(sortedEntries, {space: 2});
  return `self.${PRECACHE_MANIFEST_VAR} = (self.${PRECACHE_MANIFEST_VAR} || ` +
      `[]).concat(${entriesJson});`;
};
