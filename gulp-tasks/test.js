const gulp = require('gulp');
const oneLine = require('common-tags').oneLine;
const spawn = require('./utils/spawn-promise-wrapper');

const logHelper = require('./utils/log-helper');

const runNodeTests = () => {
  logHelper.log(oneLine`
    Running Node Tests.
  `);
  return spawn('npm', ['run', 'test', '--',
    `./test/${global.packageOrStar}/node/**/*.mjs`])
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
