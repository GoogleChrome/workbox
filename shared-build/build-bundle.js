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

const path = require('path');
const fs = require('fs');
const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const rollup = require('gulp-rollup');
const babel = require('gulp-babel');
const header = require('gulp-header');

module.exports = (options) => {
  const destPath = path.join(options.projectDir, 'build');
  const licensePath = path.join(__dirname, '..', 'LICENSE-HEADER');
  const licenseHeader = fs.readFileSync(licensePath, 'utf8');

  return new Promise((resolve, reject) => {
    gulp.src([
      path.join(options.projectDir, 'src', '**', '*.js'),
      path.join(__dirname, '..', 'lib', '**', '*.js'),
      path.join(__dirname, '..', 'node_modules', '**', '*.js'),
    ])
    .pipe(sourcemaps.init())
    .pipe(rollup(options.rollupConfig))
    .pipe(babel({
      plugins: ['transform-async-to-generator', 'external-helpers'],
      presets: ['babili', {comments: false}],
    }))
    .pipe(header(licenseHeader))
    .pipe(rename(options.outputName))
    // Source maps are written relative tot he gulp.dest() path
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(destPath))
    .on('error', (err) => {
      reject(err);
    })
    .on('end', () => {
      resolve();
    });
  });
};
