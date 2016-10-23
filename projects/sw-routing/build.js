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
// const babel = require('rollup-plugin-babel');
const uglify = require('rollup-plugin-uglify');
const pkg = require('./package.json');

const destPath = path.join(__dirname, 'build');

// This defines how the 'src/' is transpiled
// (i.e. one for ES Modules, one for UMD)
const umdBuildTargets = {
  dest: path.join(destPath, pkg.main),
  format: 'umd',
  moduleName: 'goog.routing',
  sourceMap: true
};

const esNextBuildTarget = {
  dest: path.join(destPath, pkg['jsnext:main']),
  format: 'es',
  sourceMap: true
};

const minifiedUMD = () => {
  return rollup({
    entry: path.join(__dirname, 'src', 'index.js'),
    plugins: [
      babel({
        presets: [
          [
            'es2015',
            {modules: false}
          ]
        ],
        plugins: ['external-helpers']
      }),
      uglify()
    ]
  })
  .then(bundle => {
    return bundle.write(umdBuildTargets);
  });
};

const bundledJSNext = () => {
  return rollup({
    entry: path.join(__dirname, 'src', 'index.js')
  })
  .then(bundle => {
    return bundle.write(esNextBuildTarget);
  });
};

/** module.exports = () => {
  return Promise.all([minifiedUMD(), bundledJSNext()]);
};**/

module.exports = () => {
  console.log('Here :S');
  return new Promise((resolve, reject) => {
    gulp.src([
      path.join(__dirname, 'src', '**', '*.js'),
      path.join(__dirname, '..', '..', 'lib', '**', '*.js')
    ])
    .pipe(sourcemaps.init())
    // transform the files here.
    .pipe(rollup({
      entry: path.join(__dirname, 'src', 'index.js')
    }))
    .pipe(babel({
      plugins: ['remove-comments'],
      presets: ['babili']
    }))
    .pipe(sourcemaps.write())
    .pipe(rename(pkg.main))
    // This is just the UMD model for now.
    .pipe(gulp.dest(destPath))
    .on('error', err => {
      console.error(err);
      reject(err);
    })
    .on('end', () => {
      console.log('Here ENDED:S');
      resolve();
    });
  });
};
