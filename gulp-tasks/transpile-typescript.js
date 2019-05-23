/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const fs = require('fs-extra');
const gulp = require('gulp');
const ol = require('common-tags').oneLine;
const path = require('path');
const {rollup} = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const typescript2 = require('rollup-plugin-typescript2');
const packageRunnner = require('./utils/package-runner');
const logHelper = require('../infra/utils/log-helper');
const {AsyncDebounce} = require('../infra/utils/AsyncDebounce');


/**
 * @type {string}
 */
const packagesDir = path.resolve('packages');

/**
 * Returns a Rollup plugin that replaces extensions within filenames and
 * imports. This is a bit of a hack, but it's needed until to solve:
 * https://github.com/rollup/rollup/issues/2847
 *
 * @param {string} oldExt
 * @param {string} newExt
 */
const renameImportExtensionsPlugin = (oldExt, newExt) => {
  return {
    generateBundle: (options, bundle) => {
      const importPattern =
          new RegExp(`((?:import|export)[^']+')([^']+?)\\${oldExt}';`, 'g');

      for (const chunkInfo of Object.values(bundle)) {
        if (chunkInfo.fileName.endsWith('.ts')) {
          chunkInfo.fileName = chunkInfo.fileName
              .replace(new RegExp(`\\${oldExt}$`), newExt);

          chunkInfo.code = chunkInfo.code
              .replace(importPattern, `$1$2${newExt}';`);
        }
      }
    },
  };
};

/**
 * @type {RollupCache}
 */
let moduleBundleCache;

/**
 * Transpiles a package's source TypeScript files to `.mjs` JavaScript files
 * in the root package directory, along with the correspdonging definition
 * files.
 *
 * @param {string} packageName
 */
const transpilePackage = async (packageName) => {
  const packagePath = path.join(packagesDir, packageName);

  const input = path.join(packagePath, 'src', 'index.ts');
  const plugins = [
    resolve(),
    typescript2(),
    renameImportExtensionsPlugin('.ts', '.mjs'),
  ];

  const bundle = await rollup({
    input,
    plugins,
    cache: moduleBundleCache,
    preserveModules: true,
    // We don't need to tree shake the TS to JS conversion, as that'll happen
    // later, and we don't need to add to the transpilation time.
    treeshake: false,
  });

  // Ensure rebuilds are as fast as possible in watch mode.
  moduleBundleCache = bundle.cache;

  await bundle.write({
    dir: packagePath,
    format: 'esm',
  });
};

/**
 * Transpiles a package iff it has TypeScript source files.
 *
 * @param {string} packagePath
 */
const transpilePackagesOrSkip = async (packagePath) => {
  const packageName = packagePath.split(path.sep).slice(-1)[0];

  if (await fs.pathExists(path.join(packagePath, 'src'))) {
    await queueTranspile(packageName);
  } else {
    logHelper.log(ol`Skipping package '${packageName}'
        not yet converted to typescript.`);
  }
};

/**
 * A mapping between each package name and its corresponding `AsyncDebounce`
 * instance of the `transpilePackage()` function.
 *
 * @type {{[key: string]: AsyncDebounce}}
 */
const debouncedTranspilerMap = {};

/**
 * Takes a package name and schedules that package's source TypeScript code
 * to be converted to JavaScript. If a transpilation is already scheduled, it
 * won't be queued twice, so this function is safe to call as frequenty as
 * needed.
 *
 * @param {string} packageName
 */
const queueTranspile = async (packageName) => {
  if (!debouncedTranspilerMap[packageName]) {
    debouncedTranspilerMap[packageName] = new AsyncDebounce(async () => {
      await transpilePackage(packageName);
    });
  }
  await debouncedTranspilerMap[packageName].call();
};

/**
 * A mapping between package names and whether or not they have pending
 * file changes
 *
 * @type {{[key: string]: boolean}}
 */
const pendingChangesMap = {};

/**
 * Returns true if a TypeScript file has been modified in the package since
 * the last time it was transpiled.
 *
 * @param {string} packageName
 */
const needsTranspile = (packageName) => {
  return pendingChangesMap[packageName] === true;
};

gulp.task('transpile-typescript', gulp.series(packageRunnner(
    'transpile-typescript', 'browser', transpilePackagesOrSkip)));

gulp.task('transpile-typescript:watch', gulp.series(packageRunnner(
    'transpile-typescript', 'browser', transpilePackagesOrSkip)));

gulp.task('transpile-typescript:watch', () => {
  const watcher = gulp.watch(`./${global.packageOrStar}/workbox-*/src/**/*.ts`);
  watcher.on('all', async (event, file) => {
    const changedPkg = path.relative(packagesDir, file).split(path.sep)[0];

    pendingChangesMap[changedPkg] = true;
    await queueTranspile(changedPkg);
    pendingChangesMap[changedPkg] = false;
  });
});

module.exports = {
  queueTranspile,
  needsTranspile,
};
