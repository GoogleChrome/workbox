const gulp = require('gulp');

const buildBrowserBundle = require('./utils/build-browser-bundle');
const versionModule = require('./utils/version-module');
const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');

gulp.task('build-browser-packages:browser-bundle', gulp.series(
  Object.keys(constants.BUILD_TYPES).map((buildKey) => packageRunnner(
    'build-browser-packages:browser-bundle',
    'browser',
    buildBrowserBundle,
    constants.BUILD_TYPES[buildKey],
  ))
));

gulp.task('build-browser-packages:version-module', gulp.series(
  Object.keys(constants.BUILD_TYPES).map((buildKey) => packageRunnner(
    'build-browser-packages:version-module',
    'browser',
    versionModule,
    constants.BUILD_TYPES[buildKey],
  ))
));

gulp.task('build-browser-packages', gulp.series(
  'build-browser-packages:browser-bundle',
  'build-browser-packages:version-module'
));
