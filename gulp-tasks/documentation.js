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
const rename = require('gulp-rename');
const handlebars = require('gulp-compile-handlebars');
const {globPromise, taskHarness} = require('../build-utils');

/**
 * Documents a given project.
 * @param {String} projectPath The path to a project directory.
 * @return {Promise} Resolves if documenting succeeds, rejects if it fails.
 */
const documentPackage = (projectPath) => {
  const projectMetadata = require(`${projectPath}/package.json`);
  return new Promise((resolve) => {
    // First, use metadata require(package.json to write out an initial
    // README.md.
    gulp.src('templates/Project-README.hbs')
      .pipe(handlebars({
        name: projectMetadata.name,
        description: projectMetadata.description,
        background: projectMetadata.background,
      }))
      .pipe(rename('README.md'))
      .pipe(gulp.dest(projectPath))
      .on('end', resolve);
  });
};

gulp.task('documentation:projects', () => {
  return taskHarness(documentPackage, global.projectOrStar);
});

gulp.task('documentation:repo', () => {
  if (global.projectOrStar !== '*') {
    throw Error('Please do not use --project= with documentation:repo.');
  }


  return new Promise((resolve) => {
    // First, generate a repo README.md based on metadata from each project.
    return globPromise('packages/*/package.json')
      .then((pkgs) => pkgs.map((pkg) => require(`../${pkg}`)))
      .then((projects) => {
        gulp.src('templates/README.hbs')
          .pipe(handlebars({projects: projects}))
          .pipe(rename({extname: '.md'}))
          .pipe(gulp.dest('.'))
          .on('end', resolve);
      });
  });
});

gulp.task('documentation', ['documentation:repo', 'documentation:projects']);
