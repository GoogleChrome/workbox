/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const path = require('path');
const {copyWorkboxLibraries, getModuleUrl} = require('workbox-build');

/**
 * @param {Object} compilation The webpack compilation.
 * @param {Object} config The options passed to the plugin constructor.
 * - config.excludeChunks may be modified by this function if
 *   config.importWorkboxFrom is set to a chunk name.
 * - config.modulePathPrefix may be modified by this function if
 *   config.importWorkboxFrom is set to 'local'.
 * @return {Array<string>|null} A list of URLs to use to import the Workbox
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
      const wbDir = await copyWorkboxLibraries(path.join(
          compilation.options.output.path, config.importsDirectory));

      // We need to set this extra option in the config to ensure that the
      // workbox library loader knows where to get the local libraries from.
      config.modulePathPrefix = (compilation.options.output.publicPath || '') +
        path.join(config.importsDirectory, wbDir).split(path.sep).join('/');

      const workboxSWImport = config.modulePathPrefix + '/workbox-sw.js';
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
          return chunk.files.map((file) => {
            return (compilation.options.output.publicPath || '') + file;
          });
        }
      }

      // If there's no chunk with the right name, treat it as a fatal error.
      throw Error(`importWorkboxFrom was set to ` +
        `'${config.importWorkboxFrom}', which is not an existing chunk name.`);
    }
  }
}

module.exports = getWorkboxSWImport;
