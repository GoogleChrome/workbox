const gulp = require('gulp');

const getNpmCmd = require('./utils/get-npm-cmd');
const spawn = require('./utils/spawn-promise-wrapper');

gulp.task('publish-lerna:no-push', () => {
  return spawn(getNpmCmd(), [
    'run', 'local-lerna',
    '--',
    'publish',

    // First run lerna and get it to update the relvant packages.
    '--skip-git',
    '--skip-npm',

    // TODO: The following flags are for testing deploy process and can
    // be removed

    '--cd-version=prerelease', '--preid=alpha',
    '--npm-tag', 'alpha',
  ]);
});

gulp.task('publish-lerna:push', () => {
  const lernaPkg = require('../lerna.json');
  return spawn(getNpmCmd(), [
    'run', 'local-lerna',
    '--',
    'publish',
    // Then skip all questions
    '--yes',
    // force use of the versino in lernaPkg
    '--repo-version', lernaPkg.version,

    // TODO: The following flags are for testing deploy process and can
    // be removed
    '--skip-git',
    '--skip-npm',
    '--npm-tag', 'alpha',
  ]);
});
