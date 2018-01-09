const gulp = require('gulp');

const buildBrowserBundle = require('./utils/build-browser-bundle');
const versionModule = require('./utils/version-module');
const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');

const browserBundle = gulp.series(
  Object.keys(constants.BUILD_TYPES).map((buildKey) => packageRunnner(
    'build-browser-packages:browser-bundle',
    'browser',
    buildBrowserBundle,
    constants.BUILD_TYPES[buildKey],
  ))
);
browserBundle.displayName = 'build-browser-packages:browser-bundle';

const version = gulp.series(
  Object.keys(constants.BUILD_TYPES).map((buildKey) => packageRunnner(
    'build-browser-packages:version-module',
    'browser',
    versionModule,
    constants.BUILD_TYPES[buildKey],
  ))
);
version.displayName = 'build-browser-packages:version-module';

const buildPackages = gulp.series(
  version,
  browserBundle,
);
buildPackages.displayName = 'build-browser-packages';

module.exports = buildPackages;
