const gulp = require('gulp');

const buildBrowserPackage = require('./utils/build-browser-package');
const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');

gulp.task('build-browser-packages', gulp.series(
  constants.BUILD_TYPES.map((buildType) => packageRunnner(
    'build-browser-packages',
    'browser',
    buildBrowserPackage,
    buildType
  ))
));
