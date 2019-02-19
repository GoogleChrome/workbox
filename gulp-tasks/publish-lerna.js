/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const gulp = require('gulp');

const getNpmCmd = require('./utils/get-npm-cmd');
const spawn = require('./utils/spawn-promise-wrapper');

gulp.task('publish-lerna', () => {
  return spawn(getNpmCmd(), [
    'run', 'local-lerna',
    '--',
    'publish',

    // The following flags can be used if publishing non-stable versions
    '--preid=beta',
    '--npm-tag', 'beta',
  ]);
});
