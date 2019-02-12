/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const fs = require('fs-extra');
const path = require('path');
const {rollup} = require('rollup');
const constants = require('./constants');
const logHelper = require('../../infra/utils/log-helper');
const pkgPathToName = require('./pkg-path-to-name');
const rollupHelper = require('./rollup-helper');


const ERROR_NO_MODULE_BROWSER =
  `Could not find the module's index.mjs file: `;


module.exports = async (packagePath, buildType) => {
  const packageName = pkgPathToName(packagePath);
  const moduleBrowserPath = path.join(packagePath, `index.mjs`);

  // First check if the bundle file exists, if it doesn't
  // there is nothing to build
  if (!fs.existsSync(moduleBrowserPath)) {
    logHelper.error(ERROR_NO_MODULE_BROWSER + packageName);
    return Promise.reject(ERROR_NO_MODULE_BROWSER + packageName);
  }

  const outputDirectory = path.join(
      packagePath, constants.PACKAGE_BUILD_DIRNAME);

  const esFilename = `${packageName}.${buildType.slice(0, 4)}.mjs`;
  const umdFilename = `${packageName}.${buildType.slice(0, 4)}.umd.js`;

  logHelper.log(
      `Building window module bundle: ${logHelper.highlight(esFilename)}`);
  logHelper.log(
      `Building window UMD bundle: ${logHelper.highlight(umdFilename)}`);

  // TODO(philipwalton): ensure all loaded workbox modules conform to
  // the same conventions we document to external developers. This can be
  // done with a Rollup plugin that validates them.
  const plugins = rollupHelper.getDefaultPlugins(buildType, {module: true});

  const bundle = await rollup({
    input: moduleBrowserPath,
    plugins,
    onwarn: (warning) => {
      if (buildType === constants.BUILD_TYPES.prod &&
        warning.code === 'UNUSED_EXTERNAL_IMPORT') {
        // This can occur when using rollup-plugin-replace.
        logHelper.warn(`[${warning.code}] ${warning.message}`);
        return;
      }

      // The final builds should have no warnings.
      if (warning.code && warning.message) {
        throw new Error(`Unhandled Rollup Warning: [${warning.code}] ` +
          `${warning.message}`);
      } else {
        throw new Error(`Unhandled Rollup Warning: ${warning}`);
      }
    },
  });

  // Generate both a native module and a UMD module (for compat).
  await Promise.all([
    bundle.write({
      file: path.join(outputDirectory, esFilename),
      sourcemap: true,
      format: 'es',
    }),
    bundle.write({
      file: path.join(outputDirectory, umdFilename),
      sourcemap: true,
      format: 'umd',
      name: 'workbox',
    }),
  ]);
};
