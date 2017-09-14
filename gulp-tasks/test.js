const gulp = require('gulp');
const oneLine = require('common-tags').oneLine;

const spawn = require('./utils/spawn-promise-wrapper');
const logHelper = require('../infra/utils/log-helper');

const runNodeTests = () => {
  logHelper.log(oneLine`
    Running Node Tests.
  `);
  const options = [];
  if (global.cliOptions.grep) {
    options.push('--grep', global.cliOptions.grep);
  }
  return spawn('npm', ['run', 'test', '--',
    `./test/${global.packageOrStar}/node/**/*.mjs`,
    ...options,
  ])
  .catch((err) => {
    logHelper.error(err);
    throw new Error(`[Workbox Error Msg] 'gulp test' discovered errors.`);
  });
};

gulp.task('test:node', gulp.series(
  runNodeTests
));

gulp.task('test', gulp.series(
  'build',
  'test:node',
  'lint'
));
