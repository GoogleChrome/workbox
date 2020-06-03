/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {series} = require('gulp');
const execa = require('execa');
const fse = require('fs-extra');

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

module.exports = {
  publish: series(publish_sign_in_check, publish_clean, test, publish_lerna,
      publish_github, publish_cdn),
};
