const gulp = require('gulp');

const buildNodePackage = require('./utils/build-node-package');
const packageRunnner = require('./utils/package-runner');

// GULP: why is this using gulp.series?
const buildPackages = gulp.series(
  packageRunnner(
    'build-node-packages',
    'node',
    buildNodePackage
  )
);
buildPackages.displayName = 'build-node-packages';

module.exports = buildPackages;
