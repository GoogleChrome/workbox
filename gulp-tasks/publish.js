/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {series} = require('gulp');
const execa = require('execa');
const fse = require('fs-extra');
const ol = require('common-tags').oneLine;

const {build} = require('./build');
const {build_packages_clean} = require('./build-packages');
const {publish_cdn} = require('./publish-cdn');
const {publish_github} = require('./publish-github');
const {publish_lerna} = require('./publish-lerna');
const {test} = require('./test');
const constants = require('./utils/constants');

async function publish_clean() {
  await fse.remove(constants.GENERATED_RELEASE_FILES_DIRNAME);
}

async function publish_sign_in_check() {
  await execa('npm', ['whoami']);
}

async function dist_tag_check() {
  if (!global.cliOptions.distTag) {
    throw new Error(ol`Please set the --distTag command line option, normally
        to 'latest' (for a stable release) or 'next' (for a pre-release).`);
  }
}

module.exports = {
  publish: series(
    dist_tag_check,
    publish_sign_in_check,
    build_packages_clean,
    publish_clean,
    build,
    test,
    publish_lerna,
    publish_github,
    publish_cdn,
  ),
};
