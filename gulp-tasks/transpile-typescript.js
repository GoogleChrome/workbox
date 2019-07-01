/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const fs = require('fs-extra');
const gulp = require('gulp');
const globby = require('globby');
const ol = require('common-tags').oneLine;
const path = require('upath');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const packageRunnner = require('./utils/package-runner');
const logHelper = require('../infra/utils/log-helper');
const {AsyncDebounce} = require('../infra/utils/AsyncDebounce');


/**
 * @type {string}
 */
const packagesDir = path.join(__dirname, '..', 'packages');

/**
 * Transpiles a package's source TypeScript files to `.js` and `.mjs` files
 * in the root package directory, along with the corresponding `.d.ts` files.
 *
 * @param {string} packageName
 */
const transpilePackage = async (packageName) => {
  try {
    // Compile Typescript for the given project.
    // Reference the local `node_modules` version of `tsc` since on Windows
    // it will call the version in `Microsoft SDKs/TypeScript`.
    await exec(`npm run local-tsc -- -b packages/${packageName}`);

    // Mirror all `.ts` files with `.mjs` files.
    const tsFiles = await globby(`**/*.ts`, {
      cwd: path.join('packages', packageName, 'src'),
    });

    for (const tsFile of tsFiles) {
      const assetBasename = path.basename(tsFile, '.ts');
      const mjsFile = path.join('packages',
          packageName, path.dirname(tsFile), assetBasename + '.mjs');

      if (!(await fs.pathExists(mjsFile))) {
        const mjsSource = `export * from './${assetBasename}.js';`;

        // console.log({mjsFile, tsFile, assetBasename})
        fs.outputFileSync(mjsFile, mjsSource);
      }
    }
  } catch (error) {
    logHelper.error(error.stdout);
    throw error;
  }
};

/**
 * Transpiles a package iff it has TypeScript source files.
 *
 * @param {string} packagePath
 */
const transpilePackagesOrSkip = async (packagePath) => {
  // `packagePath` will be posix style because it comes from `glog()`.
  const packageName = packagePath.split('/').slice(-1)[0];

  if (await fs.pathExists(path.join(packagePath, 'tsconfig.json'))) {
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
    'transpile-typescript', 'all', transpilePackagesOrSkip)));

gulp.task('transpile-typescript:watch', gulp.series(packageRunnner(
    'transpile-typescript', 'all', transpilePackagesOrSkip)));

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
