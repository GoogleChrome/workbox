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
const gulp = require('gulp');
const eslint = require('gulp-eslint');

const {taskHarness} = require('../utils/build');

/**
 * Lints a given project.
 * @param {String} projectPath The path to a project directory.
 * @return {Promise} Resolves if linting succeeds, rejects if it fails.
 */
const lintPackage = (projectPath) => {
  return new Promise((resolve, reject) => {
    gulp.src([`${projectPath}/**/*.js`,
      `!${projectPath}/**/build/**`,
      `!${projectPath}/**/node_modules/**`,
      ])
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.results((results) => {
        if (results.errorCount > 0) {
          reject(`Linting '${projectPath}' failed.`);
        } else {
          resolve();
        }
      }))
      // See https://github.com/adametry/gulp-eslint/issues/36#issuecomment-109595391
      .on('data', () => {});
  });
};

gulp.task('lint:repo', () => {
  return gulp.src([
    `!./packages/**/*`,
    `!./build/**`,
    `!./docs/**`,
    // Gulp -tasks
    `./**/*.js`,
    // Root level JS Files
    `../*.js`,
  ])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.results((results) => {
    if (results.errorCount > 0) {
      throw new Error(`Linting repo files failed.`);
    }
  }));
});

gulp.task('lint', ['lint:repo'], () => {
  return taskHarness(lintPackage, global.projectOrStar);
});
