/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {parallel, watch} = require('gulp');
const execa = require('execa');
const fse = require('fs-extra');
const globby = require('globby');
const ol = require('common-tags').oneLine;
const upath = require('upath');

const {AsyncDebounce} = require('../infra/utils/AsyncDebounce');
const logHelper = require('../infra/utils/log-helper');
const packageRunner = require('./utils/package-runner');

/**
 * @type {string}
 */
const packagesDir = upath.join(__dirname, '..', 'packages');

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
 * won't be queued twice, so this function is safe to call as frequently as
 * needed.
 *
 * @param {string} packageName
 * @param {Object} [options]
 */
async function queueTranspile(packageName, options) {
  if (!debouncedTranspilerMap[packageName]) {
    debouncedTranspilerMap[packageName] = new AsyncDebounce(async () => {
      await transpilePackage(packageName, options);
    });
  }
  await debouncedTranspilerMap[packageName].call();
  debouncedTranspilerMap[packageName] = null;
}

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
function needsTranspile(packageName) {
  return pendingChangesMap[packageName] === true;
}

/**
 * Transpiles a package iff it has TypeScript source files.
 *
 * @param {string} packagePath
 * @param {Object} [options]
 */
async function transpilePackageOrSkip(packagePath, options) {
  // `packagePath` will be posix style because it comes from `glob()`.
  const packageName = packagePath.split('/').slice(-1)[0];

  if (await fse.pathExists(upath.join(packagePath, 'tsconfig.json'))) {
    await queueTranspile(packageName, options);
  } else {
    logHelper.log(ol`Skipping package '${packageName}', which has
        not yet been converted to typescript.`);
  }
}

/**
 * Transpiles a package's source TypeScript files to `.js` and `.mjs` files
 * in the root package directory, along with the corresponding `.d.ts` files.
 *
 * @param {string} packageName
 * @param {Object} [options]
 * @param {boolean} [options.failOnError=true]
 */
async function transpilePackage(packageName, {failOnError = true} = {}) {
  try {
    // Compile TypeScript for the given project.
    // Reference the local `node_modules` version of `tsc` since on Windows
    // it will call the version in `Microsoft SDKs/TypeScript`.
    await execa('tsc', ['-b', `packages/${packageName}`], {preferLocal: true});

    const packagePath = upath.join('packages', packageName);

    // Don't create `.mjs` files for the node_ts packages.
    const pkgJson = require(`../${packagePath}/package.json`);
    if (pkgJson.workbox.packageType === 'node_ts') {
      return;
    }

    // Mirror all `.ts` files with `.mjs` files.
    const tsFiles = await globby(`**/*.ts`, {
      cwd: upath.join(packagePath, 'src'),
    });

    for (const tsFile of tsFiles) {
      const assetBasename = upath.basename(tsFile, '.ts');
      const mjsFile = upath.join('packages',
          packageName, upath.dirname(tsFile), `${assetBasename}.mjs`);

      if (!(await fse.pathExists(mjsFile))) {
        const mjsSource = `export * from './${assetBasename}.js';`;

        await fse.outputFile(mjsFile, mjsSource);
      }
    }
  } catch (error) {
    if (failOnError) {
      throw error;
    }

    logHelper.error(error.stdout);
  }
}

function transpile_typescript_watch() {
  const watcher = watch(`./${global.packageOrStar}/workbox-*/src/**/*.ts`);
  watcher.on('all', async (event, file) => {
    const changedPkg = upath.relative(packagesDir, file).split(upath.sep)[0];

    pendingChangesMap[changedPkg] = true;
    await queueTranspile(changedPkg, {failOnError: false});
    pendingChangesMap[changedPkg] = false;
  });
}

module.exports = {
  // These are used as functions from other modules, not as gulp tasks.
  functions: {
    needsTranspile,
    queueTranspile,
    transpilePackageOrSkip,
  },
  transpile_typescript_watch,
  transpile_typescript: parallel(packageRunner('transpile_typescript', 'all',
      transpilePackageOrSkip)),
};
