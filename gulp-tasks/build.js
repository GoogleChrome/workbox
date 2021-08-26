/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {series} = require('gulp');
const execa = require('execa');
const fse = require('fs-extra');
const upath = require('upath');

const {build_packages} = require('./build-packages');

// This is needed for workbox-build but is also used by the rollup-helper
// to add CDN details to workbox-sw.
// Make sure this runs **before** build_lerna_bootstrap.
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

async function build_lerna_bootstrap() {
  await execa('lerna', ['bootstrap'], {preferLocal: true});
}

module.exports = {
  build: series(
    build_update_cdn_details,
    build_lerna_bootstrap,
    build_packages,
  ),
};
