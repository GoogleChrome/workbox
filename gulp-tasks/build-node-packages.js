/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const gulp = require('gulp');

const buildNodePackage = require('./utils/build-node-package');
const packageRunner = require('./utils/package-runner');

gulp.task('build-node-packages', gulp.series(
    packageRunner(
        'build-node-packages',
        'node',
        buildNodePackage,
    ),
));
