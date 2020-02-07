/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

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
      '--include-dependencies',
      '--scope', global.packageOrStar,
  );
});

// This is needed for workbox-build but is also used by the rollup-helper
// to add CDN details to workbox-sw.
// Make sure this runs **before** lerna-bootstrap.
gulp.task('build:update-cdn-details', async function() {
  const cdnDetails = await fs.readJSON(path.join(
      __dirname, '..', 'cdn-details.json',
  ));

  const workboxBuildPath = path.join(
      __dirname, '..', 'packages', 'workbox-build');

  const workboxBuildCdnDetailsPath = path.join(
      workboxBuildPath, 'src', 'cdn-details.json');

  const workboxBuildPkg = await fs.readJSON(path.join(
      workboxBuildPath, 'package.json'));

  cdnDetails.latestVersion = workboxBuildPkg.version;

  await fs.writeJson(workboxBuildCdnDetailsPath, cdnDetails, {
    spaces: 2,
  });
});

gulp.task('build', gulp.series(
    'build:update-cdn-details',
    'lerna-bootstrap',
));
