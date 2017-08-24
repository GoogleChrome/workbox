/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

/* eslint-disable no-console */

const fse = require('fs-extra');
const gulp = require('gulp');
const path = require('path');
const runSequence = require('run-sequence');

const {taskHarness, lernaWrapper} = require('../utils/build');

/**
 * Updates the fields in package.json that contain version string to match
 * the latest version from lerna.json.
 *
 * @param {String} projectPath The path to a project directory.
 * @return {Promise} Resolves if updating succeeds, and rejects if it fails.
 */
const updateVersionedBundles = (projectPath) => {
  const packageJsonPath = path.join(projectPath, 'package.json');

  return fse.readJson(packageJsonPath).then((pkg) => {
    const regexp = /v\d+\.\d+\.\d+/;
    for (let field of ['main', 'module']) {
      if (field in pkg) {
        pkg[field] = pkg[field].replace(regexp, `v${pkg.version}`);
      }
    }

    return fse.writeJson(packageJsonPath, pkg, {spaces: 2});
  });
};

gulp.task('lerna-bootstrap', () => {
  return lernaWrapper('bootstrap');
});

gulp.task('lerna-bootstrap-scoped', () => {
  return lernaWrapper('bootstrap', '--include-filtered-dependencies', '--scope',
    global.projectOrStar);
});

/**
 * Helper task, used only within lerna-publish.
 */
gulp.task('_lerna-publish-dry-run', () => {
  return lernaWrapper('publish', '--skip-npm', '--skip-git');
});

gulp.task('_lerna-publish-dry-run:force-all', () => {
  return lernaWrapper('publish', '--skip-npm', '--skip-git',
    '--force-publish=*');
});

/**
 * Helper task, used only within lerna-publish.
 */
gulp.task('_update-versioned-bundles', () => {
  return taskHarness(updateVersionedBundles, global.projectOrStar);
});

/**
 * Helper task, used only within lerna-publish.
 */
gulp.task('_lerna-publish-repo-version', () => {
  return fse.readJson('lerna.json').then((lernaConfig) => {
    return lernaWrapper('publish', '--yes', '--repo-version',
      lernaConfig.version);
  });
});

/**
 * This is the task you should use to publish a new release of updated
 * modules to npm.
 */
gulp.task('lerna-publish', (callback) => {
  runSequence(
    'lerna-bootstrap',
    'test:dev',
    'test:prod',
    '_lerna-publish-dry-run',
    '_update-versioned-bundles',
    '_lerna-publish-repo-version',
    callback
  );
});

gulp.task('lerna-publish:force-all', (callback) => {
  runSequence(
    'lerna-bootstrap',
    'test:dev',
    'test:prod',
    '_lerna-publish-dry-run:force-all',
    '_update-versioned-bundles',
    '_lerna-publish-repo-version',
    callback
  );
});
