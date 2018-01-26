const gulp = require('gulp');

const build = require('./build');

const logHelper = require('../infra/utils/log-helper');

const watch = gulp.series(
  build,
  () => {
    gulp.watch(
      [
        `packages/${global.packageOrStar}/**/*.mjs`,
        '!packages/**/_version.mjs',
        '!packages/**/build/**/*',
        '!packages/**/node_modules/**/*',
      ], build,
    )
    // GULP: why is this here?
    .on('error', () => {})
    .on('change', function(path, stats) {
      logHelper.log(`gulp.watch() is running due to a change in '${path}'`);
    });
  }
);
watch.displayName = 'watch';

module.exports = watch;
