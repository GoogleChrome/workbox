const gulp = require('gulp');
const path = require('path');
const fs = require('fs-extra');

const cdnUtils = require('../packages/workbox-build/src/lib/cdn-utils');
const getNpmCmd = require('./utils/get-npm-cmd');
const spawn = require('./utils/spawn-promise-wrapper');

gulp.task('publish-demos:updateCDNDetails', () => {
  const details = {
    latestUrl: cdnUtils.getRootCDNUrl(),
  };
  const filePath = path.join(__dirname, '..', 'demos',
    'functions', 'cdn-details.json');

  return fs.writeJSON(filePath, details);
});

gulp.task('publish-demos:deploy', () => {
  return spawn(getNpmCmd(), ['run', 'demos-deploy'], {
    cwd: path.join(__dirname, '..'),
  });
});

gulp.task('publish-demos', gulp.series([
  'publish-demos:updateCDNDetails',
  'publish-demos:deploy',
]));
