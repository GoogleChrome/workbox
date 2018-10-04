const gulp = require('gulp');
const lernaWrapper = require('./utils/lerna-wrapper');
const fs = require('fs-extra');
const path = require('path');

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
    'build:update-cdn-details',
    'lerna-bootstrap',
));
