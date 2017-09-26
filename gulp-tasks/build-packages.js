const eventStream = require('event-stream');
const fse = require('fs-extra');
const gulp = require('gulp');
const path = require('path');

const buildBrowserPackage = require('./utils/build-browser-package');
const buildNodePackage = require('./utils/build-node-package');
const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');

const cleanPackage = (packagePath) => {
  const outputDirectory = path.join(packagePath,
    constants.PACKAGE_BUILD_DIRNAME);
  return fse.remove(outputDirectory);
};

gulp.task('build-packages:clean', gulp.series(
    packageRunnner.wrapFunction(
      'Cleaning Package',
      packageRunnner.getPackages(),
      cleanPackage
    )
));

gulp.task('build-packages:build', (done) => {
  const buildStreams = [];

  const nodePackages = packageRunnner.getPackages('node');
  if (nodePackages.length > 0) {
    buildStreams.push(...packageRunnner.wrapFunction(
      'Building Node Package',
      nodePackages,
      buildNodePackage
    ));
  }

  const browserPackages = packageRunnner.getPackages('browser');
  if (browserPackages.length > 0) {
    for (const buildType of constants.BUILD_TYPES) {
      buildStreams.push(...packageRunnner.wrapFunction(
        'Building Browser Package',
        browserPackages,
        buildBrowserPackage,
        buildType
      ));
    }
  }

  // Our various builds all return gulp streams. Kick them off and merge the
  // result into a single stream that will emit 'end' when they have completed.
  // Use that to signal the overall task completion.
  return eventStream.merge(buildStreams.map((func) => func()))
    .on('end', done);
});

gulp.task('build-packages', gulp.series(
  'build-packages:clean',
  'build-packages:build'
));
