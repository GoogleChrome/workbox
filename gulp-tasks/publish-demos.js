const gulp = require('gulp');
const path = require('path');
const fs = require('fs-extra');

const getVersionsCDNUrl = require('./utils/versioned-cdn-url');
const getNpmCmd = require('./utils/get-npm-cmd');
const spawn = require('./utils/spawn-promise-wrapper');
const constants = require('./utils/constants');

// TODO: This should publish based on git tags, similar to Github and CDN
// releases

const updateCDNDetails = () => {
  const details = {
    latestUrl: getVersionsCDNUrl(),
  };
  const filePath = path.join(__dirname, '..', 'demos',
    'functions', 'cdn-details.json');

  return fs.writeJSON(filePath, details);
};
updateCDNDetails.displayName = 'publish-demos:updateCDNDetails';
// GULP: Is this exposed to the CLI?
gulp.task(updateCDNDetails);

const deploy = () => {
  return spawn(getNpmCmd(), ['run', 'demos-deploy'], {
    cwd: path.join(__dirname, '..'),
  });
};
deploy.displayName = 'publish-demos:deploy';
// GULP: Is this exposed to the CLI?
gulp.task(deploy);

const clean = () => {
  return fs.remove(
    path.join(__dirname, '..', 'demos', 'public', constants.LOCAL_BUILDS_DIR)
  );
};
clean.displayName = 'publish-demos:clean';
// GULP: Is this exposed to the CLI?
gulp.task(clean);

const publishDemos = gulp.series(
  clean,
  updateCDNDetails,
  deploy,
);
publishDemos.displayName = 'publish-demos';

module.exports = publishDemos;
