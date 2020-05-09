/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {parallel} = require('gulp');
const execa = require('execa');
const fse = require('fs-extra');
const upath = require('upath');

const constants = require('./utils/constants');
const packageRunner = require('./utils/package-runner');

async function buildNodePackage(packagePath) {
  const outputDirectory = upath.join(packagePath,
      constants.PACKAGE_BUILD_DIRNAME);

  await fse.remove(outputDirectory);

  await execa('babel', [
    `${packagePath}/src`,
    '--out-dir', outputDirectory,
  ], {preferLocal: true});
}

module.exports = {
  build_node_packages: parallel(packageRunner('build_node_packages', 'node',
      buildNodePackage)),
};
