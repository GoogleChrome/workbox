const gulp = require('gulp');
const fs = require('fs-extra');
const path = require('path');

const buildNodePackage = require('./utils/build-node-package');
const packageRunnner = require('./utils/package-runner');

// This is needed for workbox-build
gulp.task('build-node-packages:update-cdn-details', function() {
  const cdnDetails = fs.readJSONSync(path.join(
    __dirname, '..', 'cdn-details.json'
  ));

  const lernaPkg = fs.readJSONSync(path.join(
    __dirname, '..', 'lerna.json'
  ));

  cdnDetails.latestVersion = lernaPkg.version;

  const workboxBuildPath = path.join(
    __dirname, '..', 'packages', 'workbox-build', 'src', 'cdn-details.json'
  );
  return fs.writeJsonSync(workboxBuildPath, cdnDetails, {
    spaces: 2,
  });
});

gulp.task('build-node-packages', gulp.series(
  'build-node-packages:update-cdn-details',
  packageRunnner(
    'build-node-packages',
    'node',
    buildNodePackage
  )
));
