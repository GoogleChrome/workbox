/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {series} = require('gulp');
const fse = require('fs-extra');
const upath = require('upath');

const {build_packages} = require('./build-packages');

// This is needed for workbox-build but is also used by the rollup-helper
// to add CDN details to workbox-sw.
async function build_update_cdn_details() {
  const cdnDetails = await fse.readJSON(
    upath.join(__dirname, '..', 'cdn-details.json'),
  );

  const workboxBuildPath = upath.join(
    __dirname,
    '..',
    'packages',
    'workbox-build',
  );

  const workboxBuildCdnDetailsPath = upath.join(
    workboxBuildPath,
    'src',
    'cdn-details.json',
  );

  const workboxBuildPkg = await fse.readJSON(
    upath.join(workboxBuildPath, 'package.json'),
  );

  cdnDetails.latestVersion = workboxBuildPkg.version;

  await fse.writeJson(workboxBuildCdnDetailsPath, cdnDetails, {
    spaces: 2,
  });
}

module.exports = {
  build: series(build_update_cdn_details, build_packages),
};
