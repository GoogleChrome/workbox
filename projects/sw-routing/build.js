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
const sourcemaps = require('gulp-sourcemaps');
const path = require('path');
const rename = require('gulp-rename');
const rollup = require('gulp-rollup');
const babel = require('gulp-babel');
const pkg = require('./package.json');

const destPath = path.join(__dirname, 'build');

const buildBundle = (options) => {
  return new Promise((resolve, reject) => {
    gulp.src([
      path.join(__dirname, 'src', '**', '*.js'),
      path.join(__dirname, '..', '..', 'lib', '**', '*.js')
    ])
    .pipe(sourcemaps.init())
    // transform the files here.
    .pipe(rollup(options.rollupConfig))
    .pipe(babel({
      plugins: ['external-helpers'],
      presets: ['babili', {comments: false}]
    }))
    .pipe(rename(options.outputName))
    // Source maps are written relative tot he gulp.dest() path
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(destPath))
    .on('error', err => {
      reject(err);
    })
    .on('end', () => {
      resolve();
    });
  });
};

module.exports = () => {
  return Promise.all([
    buildBundle({
      rollupConfig: {
        entry: path.join(__dirname, 'src', 'index.js'),
        format: 'umd',
        moduleName: 'goog.routing'
      },
      outputName: pkg.main
    }),
    buildBundle({
      rollupConfig: {
        entry: path.join(__dirname, 'src', 'index.js'),
        format: 'es'
      },
      outputName: pkg.module
    })
  ]);
};
