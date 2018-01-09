const fse = require('fs-extra');
const gulp = require('gulp');
const path = require('path');

const buildNodePackages = require('./build-node-packages');
const buildBrowserPackages = require('./build-browser-packages');

const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');

const cleanPackage = (packagePath) => {
  const outputDirectory = path.join(packagePath,
    constants.PACKAGE_BUILD_DIRNAME);
  return fse.remove(outputDirectory);
};

// GULP: Why is this using gulp.series?
const clean = gulp.series(
    packageRunnner(
      'build-packages:clean',
      'all',
      cleanPackage
    )
);
clean.displayName = 'build-packages:clean';
// GULP: Is this exposed to the CLI?
gulp.task(clean);

const build = gulp.parallel(
  buildNodePackages,
  buildBrowserPackages
);
build.displayName = 'build-packages:build';
// GULP: Is this exposed to the CLI?
gulp.task(build);

const buildPackages = gulp.series(
  clean,
  build
);
buildPackages.displayName = 'build-packages';

module.exports = buildPackages;
