const gulp = require('gulp');

const getNpmCmd = require('./utils/get-npm-cmd');
const spawn = require('./utils/spawn-promise-wrapper');

gulp.task('demos:serve', () => {
  return spawn(getNpmCmd(), [
    'run', 'demos-serve',
  ]);
});

gulp.task('demos', gulp.series([
  'demos:serve',
]));
