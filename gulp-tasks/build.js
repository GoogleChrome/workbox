const gulp = require('gulp');
const lernaWrapper = require('./utils/lerna-wrapper');

gulp.task('lerna-bootstrap', () => {
  // If it's a star, build all projects (I.e. bootstrap everything.)
  if (global.packageOrStar === '*') {
    return lernaWrapper.bootstrap();
  }

  // If it's not a star, we can scope the build to a specific project.
  return lernaWrapper.bootstrap(
    '--include-filtered-dependencies',
    '--scope', global.packageOrStar
  );
});

gulp.task('build', gulp.series(
  'lerna-bootstrap',
));
