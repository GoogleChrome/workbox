/*
  Copyright 2017 Google Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const fse = require('fs-extra');
const path = require('path');

const errors = require('./errors');
const useBuildType = require('./use-build-type');

// Used to filter the libraries to copy based on our package.json dependencies.
const WORKBOX_PREFIX = 'workbox-';
const BUILD_TYPES = [
  'dev',
  'prod',
];

module.exports = async (destDirectory) => {
  const thisPkg = require('../../package.json');
  // Use the version string from workbox-build in the name of the parent
  // directory. This should be safe, because lerna will bump workbox-build's
  // pkg.version whenever one of the dependent libraries gets bumped, and we
  // care about versioning the dependent libraries.
  const workboxDirectoryName = `workbox-v${thisPkg.version}`;
  const workboxDirectoryPath = path.join(destDirectory, workboxDirectoryName);
  await fse.ensureDir(workboxDirectoryPath);

  const copyPromises = [];
  const librariesToCopy = Object.keys(thisPkg.dependencies).filter(
    (dependency) => dependency.startsWith(WORKBOX_PREFIX));
  for (const library of librariesToCopy) {
    const pkg = require(`${library}/package.json`);
    // TODO: This will change to pkg.main at some point.
    const defaultPathToLibrary = require.resolve(`${library}/${pkg.browser}`);

    for (const buildType of BUILD_TYPES) {
      const srcPath = useBuildType(defaultPathToLibrary, buildType);
      const destPath = path.join(workboxDirectoryPath,
        path.basename(srcPath));
      copyPromises.push(fse.copy(srcPath, destPath));
      copyPromises.push(fse.copy(`${srcPath}.map`, `${destPath}.map`));
    }
  }

  try {
    await Promise.all(copyPromises);
    return workboxDirectoryName;
  } catch (error) {
    throw Error(`${errors['unable-to-copy-workbox-libraries']} ${error}`);
  }
};
