/*
  Copyright 2020 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const childProcess = require('child_process');
const tempy = require('tempy');
const upath = require('upath');
const util = require('util');

const exec = util.promisify(childProcess.exec);

const packagesToInstall = [
  'workbox-build',
  'workbox-cli',
  'workbox-webpack-plugin',
];

let temporaryDirectory;

describe('[all] Yarn Installation', function() {
  before(async function() {
    temporaryDirectory = await tempy.directory();
  });

  for (const packageToInstall of packagesToInstall) {
    it(`should install ${packageToInstall} using yarn`, async function() {
      try {
        const packagePath = upath.resolve('packages', packageToInstall);
        await exec(`yarn add ${packagePath}`, {cwd: temporaryDirectory});
      } catch (error) {
        if (error.code === 127) {
          // Skip the test if yarn isn't installed.
          // (It will always be installed on GitHub Actions.)
          this.skip();
        } else {
          throw error;
        }
      }
    });
  }
});
