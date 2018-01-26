const gulp = require('gulp');
const path = require('path');
const fs = require('fs-extra');

const test = require('./test');
const publishCdn = require('./publish-cdn');
const publishDemos = require('./publish-demos');
const publishLerna = require('./publish-lerna');
const publishGithub = require('./publish-github');

const getNpmCmd = require('./utils/get-npm-cmd');
const spawn = require('./utils/spawn-promise-wrapper');
const logHelper = require('../infra/utils/log-helper');
const constants = require('./utils/constants');

const publishClean = () => {
  return fs.remove(path.join(__dirname, '..',
    constants.GENERATED_RELEASE_FILES_DIRNAME));
};
publishClean.displayName = 'publish:clean';

const publishCdnGit = gulp.series(
  publishClean,
  publishGithub,
  publishCdn,
);
publishCdnGit.displayName = 'publish:cdn+git';

const publishSignin = async () => {
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
};
publishSignin.displayName = 'publish:signin';

const publish = gulp.series(
  publishSignin,
  test,
  publishLerna,
  publishCdnGit,
  publishDemos,
);
publish.displayName = 'publish';

module.exports = publish;
