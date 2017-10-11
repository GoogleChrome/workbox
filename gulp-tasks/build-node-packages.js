const gulp = require('gulp');
const fs = require('fs-extra');
const path = require('path');

const buildNodePackage = require('./utils/build-node-package');
const packageRunnner = require('./utils/package-runner');

// This is needed for workbox-build
gulp.task('build-node-packages:update-cdn-details', function() {
  const cdnDetails = JSON.parse(
    fs.readFileSync(path.join(
      __dirname, '..', 'cdn-details.json'
    )).toString()
  );

  const lernaPkg = JSON.parse(
    fs.readFileSync(path.join(
      __dirname, '..', 'lerna.json'
    )).toString()
  );

  cdnDetails.latestVersion = lernaPkg.version;

  const workboxBuildPath = path.join(
    __dirname, '..', 'packages', 'workbox-build', 'src', 'cdn-details.json'
  );
  return fs.writeFile(workboxBuildPath, JSON.stringify(cdnDetails, null, 2));
});

gulp.task('build-node-packages', gulp.series(
  'build-node-packages:update-cdn-details',
  packageRunnner(
    'build-node-packages',
    'node',
    buildNodePackage
  )
));
