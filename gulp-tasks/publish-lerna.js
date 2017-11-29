const gulp = require('gulp');

const getNpmCmd = require('./utils/get-npm-cmd');
const spawn = require('./utils/spawn-promise-wrapper');

gulp.task('publish-lerna', () => {
  return spawn(getNpmCmd(), [
    'run', 'local-lerna',
    '--',
    'publish',

    // TODO: The following flags are for testing deploy process and can
    // be removed

    '--cd-version=prerelease', '--preid=alpha',
    '--npm-tag', 'alpha',
  ]);
});
