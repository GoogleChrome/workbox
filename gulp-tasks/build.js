const gulp = require('gulp');

const lernaWrapper = require('./utils/lerna-wrapper');

gulp.task('lerna-bootstrap', () => {
  // If it's a start, build all projects (I.e. bootstrap everything.)
  if (global.projectOrStar === '*') {
    return lernaWrapper.bootstrap();
  }

  // If it's not a start, we can scope the build to a specific project.
  return lernaWrapper.bootstrap(
    '--include-filtered-dependencies',
    '--scope', global.projectOrStar
  );
});

gulp.task('build', gulp.series(
  'lerna-bootstrap'
));
