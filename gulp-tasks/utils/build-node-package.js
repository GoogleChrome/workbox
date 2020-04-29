/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const babel = require('gulp-babel');
const gulp = require('gulp');
const oneLine = require('common-tags').oneLine;
const path = require('path');

const constants = require('./constants');
const logHelper = require('../../infra/utils/log-helper');
const pkgPathToName = require('./pkg-path-to-name');

module.exports = (packagePath) => {
  const packageName = pkgPathToName(packagePath);
  const outputDirectory = path.join(packagePath,
      constants.PACKAGE_BUILD_DIRNAME);

  logHelper.log(oneLine`
    Building Node Package for
    ${logHelper.highlight(packageName)}.
  `);

  return gulp.src(`${packagePath}/src/**`).pipe(babel({
    only: [/\.js$/],
    presets: [
      ['@babel/preset-env', {
        targets: {
          // Change this when our minimum required node version changes.
          node: '10.0',
        },
      }],
    ],
  })).pipe(gulp.dest(outputDirectory));
};
