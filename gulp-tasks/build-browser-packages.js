/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const gulp = require('gulp');

const {transpilePackageOrSkip} = require('./transpile-typescript');
const buildBrowserBundle = require('./utils/build-browser-bundle');
const versionModule = require('./utils/version-module');
const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');


gulp.task('build-browser-packages:browser-bundle', gulp.series(
    packageRunnner('build-browser-packages:transpile-typescript',
        'browser', transpilePackageOrSkip),
    Object.keys(constants.BUILD_TYPES).map((buildKey) => packageRunnner(
        'build-browser-packages:browser-bundle',
        'browser',
        buildBrowserBundle,
        constants.BUILD_TYPES[buildKey],
    )),
));

gulp.task('build-browser-packages:version-module', gulp.series(
    packageRunnner(
        'build-browser-packages:version-module',
        'browser',
        versionModule),
));

gulp.task('build-browser-packages', gulp.series(
    'build-browser-packages:version-module',
    'build-browser-packages:browser-bundle',
));
