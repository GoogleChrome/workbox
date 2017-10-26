const gulp = require('gulp');

gulp.task('test', gulp.series(
  'test-node',
  'build',
  'test-integration',
  'lint',
));
