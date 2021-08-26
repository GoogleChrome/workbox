/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const execa = require('execa');
const fse = require('fs-extra');
const globby = require('globby');
const upath = require('upath');

const {AsyncDebounce} = require('../infra/utils/AsyncDebounce');

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
      await transpile_typescript();
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
 * Transpiles all packages listed in the root tsconfig.json's references section
 * into .js and .d.ts files. Creates stub .mjs files that re-export the contents
 * of the .js files.
 *
 * Unlike other scripts, this does not take the --package= command line param
 * into account. Each project in packages/ theoretically could depend on any
 * other project, so kicking off a single, top-level compilation makes the
 * most sense (and is faster when all the packages need to be compiled).
 */
async function transpile_typescript() {
  await execa('tsc', ['--build', 'tsconfig.json'], {preferLocal: true});

  const jsFiles = await globby(`packages/*/**/*.js`, {
    ignore: ['**/build/**', '**/src/**'],
  });

  for (const jsFile of jsFiles) {
    const {dir, name} = upath.parse(jsFile);
    const mjsFile = upath.join(dir, `${name}.mjs`);
    const mjsSource = `export * from './${name}.js';`;
    await fse.outputFile(mjsFile, mjsSource);
  }
}

async function transpile_typescript_watch() {
  await execa('tsc', ['--build', '--watch', 'tsconfig.json'], {
    preferLocal: true,
  });
}

module.exports = {
  // These are used as functions from other modules, not as gulp tasks.
  functions: {
    needsTranspile,
    queueTranspile,
  },
  transpile_typescript_watch,
  transpile_typescript,
};
