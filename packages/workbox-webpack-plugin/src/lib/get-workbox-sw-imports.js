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

const {copyWorkboxLibraries, getModuleUrl} = require('workbox-build');

/**
 * @param {Object} compilation The webpack compilation.
 * @param {Object} config The options passed to the plugin constructor.
 * - config.excludeChunks may be modified by this function if
 *   config.importWorkboxFrom is set to a chunk name.
 * - config.modulePathPrefix may be modified by this function if
 *   config.importWorkboxFrom is set to 'local'.
 * @return {Array<String>|null} A list of URLs to use to import the Workbox
 * runtime code, or null if importWorkboxFrom is 'disabled'.
 * @private
 */
async function getWorkboxSWImport(compilation, config) {
  switch (config.importWorkboxFrom) {
    case 'cdn': {
      return [getModuleUrl('workbox-sw')];
    }

    case 'local': {
      // This will create a local copy of the Workbox runtime libraries in
      // the output directory, independent of the webpack build pipeline.
      // In general, this should work, but one thing to keep in mind is that
      // when using the webpack-dev-server, the output will be created on
      // disk, rather than in the in-memory filesystem. (webpack-dev-server will
      // still be able to serve the runtime libraries from disk.)
      const wbDir = await copyWorkboxLibraries(compilation.options.output.path);
      const workboxSWImport = (compilation.options.output.publicPath || '')
        + wbDir + '/workbox-sw.js';
      // We need to set this extra option in the config to ensure that the
      // workbox library loader knows where to get the local libraries from.
      config.modulePathPrefix = wbDir;
      return [workboxSWImport];
    }

    case 'disabled': {
      return null;
    }

    default: {
      // If importWorkboxFrom is anything else, then treat it as the name of
      // a webpack chunk that corresponds to the custom compilation of the
      // Workbox code.
      for (const chunk of compilation.chunks) {
        // Make sure that we actually have a chunk with the appropriate name.
        if (chunk.name === config.importWorkboxFrom) {
          config.excludeChunks.push(chunk.name);
          return chunk.files;
        }
      }

      // If there's no chunk with the right name, treat it as a fatal error.
      throw Error(`importWorkboxFrom was set to ` +
        `'${config.importWorkboxFrom}', which is not an existing chunk name.`);
    }
  }
}

module.exports = getWorkboxSWImport;
