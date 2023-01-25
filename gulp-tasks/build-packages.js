/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {parallel, series} = require('gulp');
const del = require('del');
const fse = require('fs-extra');
const upath = require('upath');

const {
  build_node_packages,
  build_node_ts_packages,
} = require('./build-node-packages');
const {build_sw_packages} = require('./build-sw-packages');
const {build_window_packages} = require('./build-window-packages');
const {transpile_typescript} = require('./transpile-typescript');
const constants = require('./utils/constants');
const packageRunner = require('./utils/package-runner');

async function cleanPackage(packagePath) {
  // Delete generated files from the the TypeScript transpile.
  if (await fse.pathExists(upath.join(packagePath, 'src', 'index.ts'))) {
    // Store the list of deleted files, so we can delete directories after.
    const deletedPaths = await del([
      `${packagePath}/**/*.+(js|mjs|d.ts)`,
      // Don't delete files in node_modules.
      '!**/node_modules/**/*',
      // Don't delete anything under src.
      `!${packagePath}/src/**/*`,
    ]);

    // Any directories in `deletedPaths` that are top-level directories to the
    // package should also be deleted since those directories should only
    // contain generated `.mjs` and `.d.ts` files.
    const directoriesToDelete = new Set();
    for (const deletedPath of deletedPaths) {
      const relativePath = upath.relative(packagePath, deletedPath);
      const directory = relativePath.split(upath.sep)[0];
      directoriesToDelete.add(upath.join(packagePath, directory));
    }
    await del([...directoriesToDelete]);
  }

  // Delete build files.
  await del(upath.join(packagePath, constants.PACKAGE_BUILD_DIRNAME));

  // Delete tsc artifacts (if present).
  await del(upath.join(packagePath, 'tsconfig.tsbuildinfo'));
}

// Wrap this in a function since it's used multiple times.
function cleanSequence() {
  return parallel(packageRunner('build_packages_clean', 'all', cleanPackage));
}

module.exports = {
  build_packages_clean: cleanSequence(),
  build_packages: series(
    // This needs to be a series, not in parallel, so that there isn't a
    // race condition with the terser nameCache.
    transpile_typescript,
    series(build_sw_packages, build_window_packages),
    parallel(build_node_packages, build_node_ts_packages),
  ),
};
