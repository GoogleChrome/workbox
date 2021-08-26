/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {parallel, series} = require('gulp');
const {rollup} = require('rollup');
const fse = require('fs-extra');
const ol = require('common-tags').oneLine;
const upath = require('upath');

const constants = require('./utils/constants');
const logHelper = require('../infra/utils/log-helper');
const packageRunner = require('./utils/package-runner');
const pkgPathToName = require('./utils/pkg-path-to-name');
const rollupHelper = require('./utils/rollup-helper');
const versionModule = require('./utils/version-module');

async function buildWindowBundle(packagePath, buildType) {
  const packageName = pkgPathToName(packagePath);
  const packageIndex = upath.join(packagePath, 'index.mjs');

  if (!(await fse.exists(packageIndex))) {
    throw new Error(`Could not find ${packageIndex}`);
  }

  const outputDirectory = upath.join(
    packagePath,
    constants.PACKAGE_BUILD_DIRNAME,
  );

  const esmFilename = `${packageName}.${buildType.slice(0, 4)}.mjs`;
  const esmLegacyFilename = `${packageName}.${buildType.slice(0, 4)}.es5.mjs`;
  const umdFilename = `${packageName}.${buildType.slice(0, 4)}.umd.js`;

  const onwarn = (warning) => {
    // This can occur when using rollup-plugin-replace.
    if (
      buildType === constants.BUILD_TYPES.prod &&
      warning.code === 'UNUSED_EXTERNAL_IMPORT'
    ) {
      logHelper.warn(`[${warning.code}] ${warning.message}`);
      return;
    }

    // The final builds should have no warnings.
    if (warning.code && warning.message) {
      throw new Error(ol`Unhandled Rollup Warning:
          [${warning.code}] ${warning.message}`);
    } else {
      throw new Error(`Unhandled Rollup Warning: ${warning}`);
    }
  };

  const mjsBundle = await rollup({
    input: packageIndex,
    plugins: rollupHelper.getDefaultPlugins(buildType, 'esm', false),
    onwarn,
  });

  const es5Bundle = await rollup({
    input: packageIndex,
    plugins: rollupHelper.getDefaultPlugins(buildType, 'esm', true),
    onwarn,
  });

  const umdBundle = await rollup({
    input: packageIndex,
    plugins: rollupHelper.getDefaultPlugins(buildType, 'umd', true),
    onwarn,
  });

  // Generate both a native module and a UMD module (for compat).
  await Promise.all([
    mjsBundle.write({
      file: upath.join(outputDirectory, esmFilename),
      sourcemap: true,
      format: 'esm',
    }),
    es5Bundle.write({
      file: upath.join(outputDirectory, esmLegacyFilename),
      sourcemap: true,
      format: 'esm',
    }),
    umdBundle.write({
      file: upath.join(outputDirectory, umdFilename),
      sourcemap: true,
      format: 'umd',
      name: 'workbox',
    }),
  ]);
}

// This reads a little cleaner with a function to generate the sub-sequences.
function windowBundleSequence() {
  const builds = Object.keys(constants.BUILD_TYPES).map((type) =>
    packageRunner(
      'build_window_packages_bundle',
      'window',
      buildWindowBundle,
      constants.BUILD_TYPES[type],
    ),
  );

  return series(builds);
}

module.exports = {
  build_window_packages: series(
    parallel(
      packageRunner(
        'build_window_packages_version_module',
        'window',
        versionModule,
      ),
    ),
    windowBundleSequence(),
  ),
};
