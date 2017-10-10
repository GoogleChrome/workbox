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

module.exports = async (destDirectory, buildType) => {
  const defaultWorkboxSourcePath = require.resolve('workbox-sw');
  // Replace the build type to get, e.g., the dev build, as needed.
  const workboxSWSrcPath = useBuildType(defaultWorkboxSourcePath, buildType);
  const workboxSWDestPath = path.join(destDirectory,
    path.basename(workboxSWSrcPath));

  try {
    await Promise.all([
      fse.copy(workboxSWSrcPath, workboxSWDestPath),
      fse.copy(`${workboxSWSrcPath}.map`, `${workboxSWDestPath}.map`),
    ]);

    return workboxSWDestPath;
  } catch (error) {
    throw Error(`${errors['unable-to-copy-workbox-sw']} ${error}`);
  }
};
