/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const gulp = require('gulp');
const spawn = require('./utils/spawn-promise-wrapper');
const getNpmCmd = require('./utils/get-npm-cmd');
const logHelper = require('../infra/utils/log-helper');

// Use npm run lint to ensure we are using local eslint
gulp.task('lint', () => {
  return spawn(getNpmCmd(), ['run', 'lint'])
      .catch((err) => {
        logHelper.error(err);
        throw new Error(`[Workbox Error Msg] 'gulp lint' discovered errors.`);
      });
});
