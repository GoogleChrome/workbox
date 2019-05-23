/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const del = require('del');
const fs = require('fs-extra');
const gulp = require('gulp');
const path = require('path');

const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');

const cleanPackage = async (packagePath) => {
  // Delete generate files from the the TypeScript transpile.
  if (await fs.pathExists(path.join(packagePath, 'src', 'index.ts'))) {
    const deletedPaths = await del([
      path.join(packagePath, '**/*.+(mjs|d.ts)'),
      // Don't delete files in node_modules
      '!**/node_modules', '!**/node_modules/**/*',
    ]);

    const directoriesToDelete = new Set();
    for (const deletedPath of deletedPaths) {
      const relativePath = path.relative(packagePath, deletedPath);
      const directory = relativePath.split(path.sep)[0];
      directoriesToDelete.add(path.join(packagePath, directory));
    }
    await del([...directoriesToDelete]);
  }
  // Delete build files.
  await del(path.join(packagePath, constants.PACKAGE_BUILD_DIRNAME));
};

gulp.task('build-packages:clean', gulp.series(
    packageRunnner(
        'build-packages:clean',
        'all',
        cleanPackage
    )
));

gulp.task('build-packages:build', gulp.series(
    'transpile-typescript',
    gulp.parallel(
        'build-node-packages',
        'build-browser-packages',
        'build-window-packages')));

gulp.task('build-packages', gulp.series(
    'build-packages:clean',
    'build-packages:build'
));
