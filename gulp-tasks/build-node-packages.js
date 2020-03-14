/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const gulp = require('gulp');

const buildNodePackage = require('./utils/build-node-package');
const packageRunnner = require('./utils/package-runner');

gulp.task('build-node-packages', gulp.series(
    packageRunnner(
        'build-node-packages',
        'node',
        buildNodePackage,
    ),
));
