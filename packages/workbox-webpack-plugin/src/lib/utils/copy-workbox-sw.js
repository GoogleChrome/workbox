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

const path = require('path');
const {readFile} = require('./read-file');
const errors = require('workbox-build/src/lib/errors');
const useBuildType = require('workbox-build/src/lib/use-build-type');

module.exports = async () => {
  // TODO: this should also support importing workbox-sw from a CDN
  const buildType = (process.env.NODE_ENV &&
    process.env.NODE_ENV.startsWith('dev')) ? 'dev' : 'prod';
  // workbox-sw is installed as a dependency of workbox-build.
  const defaultWorkboxSourcePath = require.resolve(
    'workbox-build/node_modules/workbox-sw');
  const workboxSWSrcPath = useBuildType(defaultWorkboxSourcePath, buildType);

  try {
    const [workboxSW, workboxSWMap] = await Promise.all([
      readFile(workboxSWSrcPath),
      readFile(`${workboxSWSrcPath}.map`),
    ]);

    return {
      workboxSW,
      workboxSWMap,
      workboxSWName: path.basename(workboxSWSrcPath),
    };
  } catch (error) {
    throw Error(`${errors['unable-to-copy-workbox-sw']} ${error}`);
  }
};
