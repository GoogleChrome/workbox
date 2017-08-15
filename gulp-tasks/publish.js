const gulp = require('gulp');

gulp.task('publish', gulp.series([
  'build',
  'test',
  'publish-bundle',
]));
