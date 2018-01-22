const fs = require('fs-extra');
const gulp = require('gulp');
const path = require('path');

const constants = require('./utils/constants');
const lernaWrapper = require('./utils/lerna-wrapper');

// While not strictly necessary, it's good practice to start with a fresh
// set of name mappings to feed into the UglifyJS plugin.
gulp.task('clean-uglify-name-cache', async () => {
  await fs.remove(constants.UGLIFY_NAME_CACHE_FILE);
});

gulp.task('lerna-bootstrap', () => {
  // If it's a star, build all projects (I.e. bootstrap everything.)
  if (global.packageOrStar === '*') {
    return lernaWrapper.bootstrap();
  }

  // If it's not a star, we can scope the build to a specific project.
  return lernaWrapper.bootstrap(
    '--include-filtered-dependencies',
    '--scope', global.packageOrStar
  );
});

// This is needed for workbox-build but is also used by the rollup-helper
// to add CDN details to workbox-sw.
// Make sure this runs **before** lerna-bootstrap.
gulp.task('build:update-cdn-details', async function() {
  const cdnDetails = await fs.readJSON(path.join(
    __dirname, '..', 'cdn-details.json'
  ));

  const lernaPkg = await fs.readJSON(path.join(
    __dirname, '..', 'lerna.json'
  ));

  cdnDetails.latestVersion = lernaPkg.version;

  const workboxBuildPath = path.join(
    __dirname, '..', 'packages', 'workbox-build', 'src', 'cdn-details.json'
  );

  await fs.writeJson(workboxBuildPath, cdnDetails, {
    spaces: 2,
  });
});

gulp.task('build', gulp.series(
  'clean-uglify-name-cache',
  'build:update-cdn-details',
  'lerna-bootstrap',
));
