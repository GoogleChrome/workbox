const gulp = require('gulp');
const path = require('path');

const getNpmCmd = require('./utils/get-npm-cmd');
const spawn = require('./utils/spawn-promise-wrapper');

gulp.task('publish-demos', () => {
  return spawn(getNpmCmd(), ['run', 'demos-deploy'], {
    cwd: path.join(__dirname, '..'),
  });
});
