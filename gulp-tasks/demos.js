const gulp = require('gulp');

const spawn = require('./utils/spawn-promise-wrapper');

gulp.task('demos:serve', () => {
  return spawn('firebase', [
    'serve',
    '--only', 'hosting,functions',
  ]);
});

gulp.task('demos', gulp.series([
  'demos:serve',
]));
