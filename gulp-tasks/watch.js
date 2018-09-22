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
        logHelper.log(`gulp.watch() is running due to a change in '${path}'`);
      });
  }
));
