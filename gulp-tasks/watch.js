/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const gulp = require('gulp');

const logHelper = require('../infra/utils/log-helper');

gulp.task('watch', gulp.series(
    'build',
    () => {
      gulp.watch(
          [
            `packages/${global.packageOrStar}/**/*.mjs`,
            '!packages/**/_version.mjs',
            '!packages/**/build/**/*',
            '!packages/**/node_modules/**/*',
          ], gulp.series('build'),
      )
          .on('error', () => {})
          .on('change', function(path, stats) {
            logHelper.log(`gulp.watch() was triggered by '${path}'`);
          });
    },
));
