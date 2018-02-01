const gulp = require('gulp');
const path = require('path');
const fs = require('fs-extra');

const getNpmCmd = require('./utils/get-npm-cmd');
const spawn = require('./utils/spawn-promise-wrapper');
const logHelper = require('../infra/utils/log-helper');
const constants = require('./utils/constants');

gulp.task('publish:clean', () => {
  return fs.remove(path.join(__dirname, '..',
    constants.GENERATED_RELEASE_FILES_DIRNAME));
});

gulp.task('publish:signin', async () => {
  try {
    await spawn(getNpmCmd(), [
      'whoami',
    ]);
  } catch (err) {
    // Sign in
    logHelper.warn('');
    logHelper.warn('    You must be signed in to NPM to publish.');
    logHelper.warn('    Please run `npm login` to publish.');
    logHelper.warn('');
    process.exit(1);
  }
});

gulp.task('publish-assets', gulp.series([
  'publish:clean',
  'publish-github',
  'publish-cdn',
  'publish-demos',
]));

gulp.task('publish', gulp.series([
  'publish:signin',
  'test',
  'publish-lerna',
  () => {
    logHelper.log(`The release was successful!\n\n`);
    logHelper.log(`Now run ${logHelper.highlight('gulp publish-assets')}\n\n`);

    // Gulp requires a promise.
    return Promise.resolve();
  },
]));
