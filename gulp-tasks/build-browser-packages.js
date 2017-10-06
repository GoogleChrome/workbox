const gulp = require('gulp');

const buildBrowserPackage = require('./utils/build-browser-package');
const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');

gulp.task('build-browser-packages', gulp.series(
  Object.keys(constants.BUILD_TYPES).map((buildKey) => packageRunnner(
    'build-browser-packages',
    'browser',
    buildBrowserPackage,
    constants.BUILD_TYPES[buildKey],
  ))
));
