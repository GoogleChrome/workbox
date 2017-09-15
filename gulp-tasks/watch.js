const gulp = require('gulp');

gulp.task('watch', gulp.series(
  'build',
  () => {
    gulp.watch(
      [
        'packages/**/*.mjs',
        '!packages/**/builds/**/*',
        '!packages/**/node_modules/**/*',
      ], gulp.series('build'),
    ).on('error', () => {});
  }
));
