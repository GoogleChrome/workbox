const gulp = require('gulp');

gulp.task('publish', gulp.series([
  'build',
  'test',
  'publish-lerna',
  'publish-bundle',
]));
