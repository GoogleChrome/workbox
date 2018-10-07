/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const fse = require('fs-extra');
const gulp = require('gulp');
const path = require('path');

const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');

const cleanPackage = (packagePath) => {
  const outputDirectory = path.join(packagePath,
      constants.PACKAGE_BUILD_DIRNAME);
  return fse.remove(outputDirectory);
};

gulp.task('build-packages:clean', gulp.series(
    packageRunnner(
        'build-packages:clean',
        'all',
        cleanPackage
    )
));

gulp.task('build-packages:build', gulp.parallel(
    'build-node-packages',
    'build-browser-packages'
));

gulp.task('build-packages', gulp.series(
    'build-packages:clean',
    'build-packages:build'
));
