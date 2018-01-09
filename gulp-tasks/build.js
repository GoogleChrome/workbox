const gulp = require('gulp');
const lernaWrapper = require('./utils/lerna-wrapper');
const fs = require('fs-extra');
const path = require('path');

const lernaBootstrap = () => {
  // If it's a star, build all projects (I.e. bootstrap everything.)
  if (global.packageOrStar === '*') {
    return lernaWrapper.bootstrap();
  }

  // If it's not a star, we can scope the build to a specific project.
  return lernaWrapper.bootstrap(
    '--include-filtered-dependencies',
    '--scope', global.packageOrStar
  );
};
lernaBootstrap.displayName = 'lerna-bootstrap';

// This is needed for workbox-build but is also used by the rollup-helper
// to add CDN details to workbox-sw.
// Make sure this runs **before** lerna-bootstrap.
const updateCdnDetails = async () => {
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
};
updateCdnDetails.displayName = 'build:update-cdn-details';

const build = gulp.series(
  updateCdnDetails,
  lernaBootstrap,
);
build.displayName = 'build';

module.exports = build;
