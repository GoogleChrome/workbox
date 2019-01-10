/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const buffer = require('vinyl-buffer');
const fs = require('fs-extra');
const gulp = require('gulp');
const path = require('path');
const rename = require('gulp-rename');
const rollup = require('rollup');
const rollupStream = require('rollup-stream');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');

const constants = require('./constants');
const logHelper = require('../../infra/utils/log-helper');
const pkgPathToName = require('./pkg-path-to-name');
const rollupHelper = require('./rollup-helper');


const ERROR_NO_MODULE_BROWSER =
  `Could not find the module's index.mjs file: `;


module.exports = (packagePath, buildType) => {
  const packageName = pkgPathToName(packagePath);
  const moduleBrowserPath = path.join(packagePath, `index.mjs`);

  // First check if the bundle file exists, if it doesn't
  // there is nothing to build
  if (!fs.existsSync(moduleBrowserPath)) {
    logHelper.error(ERROR_NO_MODULE_BROWSER + packageName);
    return Promise.reject(ERROR_NO_MODULE_BROWSER + packageName);
  }

  const outputFilename = `${packageName}.${buildType.slice(0, 4)}.mjs`;
  const outputDirectory = path.join(
      packagePath, constants.PACKAGE_BUILD_DIRNAME);

  logHelper.log(
      `Building Window Bundle: ${logHelper.highlight(outputFilename)}`);

  // TODO(philipwalton): ensure all loaded workbox modules conform to
  // the same conventions we document to external developers. This can be
  // done with a Rollup plugin that validates them.
  const plugins = rollupHelper.getDefaultPlugins(buildType, {module: true});

  return rollupStream({
    input: moduleBrowserPath,
    rollup,
    output: {
      sourcemap: true,
      format: 'es',
    },
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
  })
      .on('error', (err) => {
        const args = Object.keys(err).map((key) => `${key}: ${err[key]}`);
        logHelper.error(err, `\n\n${args.join('\n')}`);
        throw err;
      })
  // We must give the generated stream the same name as the entry file
  // for the sourcemaps to work correctly
      .pipe(source(moduleBrowserPath))
  // gulp-sourcemaps don't work with streams so we need
      .pipe(buffer())
  // This tells gulp-sourcemaps to load the inline sourcemap
      .pipe(sourcemaps.init({loadMaps: true}))
  // This renames the output file
      .pipe(rename(outputFilename))
  // This writes the sourcemap alongside the final build file
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(outputDirectory));
};
