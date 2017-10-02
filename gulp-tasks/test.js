const gulp = require('gulp');
const oneLine = require('common-tags').oneLine;

const spawn = require('./utils/spawn-promise-wrapper');
const getNpmCmd = require('./utils/get-npm-cmd');
const logHelper = require('../infra/utils/log-helper');

const runNodeTestsWithEnv = (nodeEnv) => {
  return () => {
    logHelper.log(oneLine`
      Running Node Tests.
    `);
    const options = [];
    if (global.cliOptions.grep) {
      options.push('--grep', global.cliOptions.grep);
    }
    const originalNodeEnv = process.env.NODE_ENV;

    process.env.NODE_ENV = nodeEnv;
    return spawn(getNpmCmd(), ['run', 'test', '--',
      `./test/${global.packageOrStar}/node/**/*.{js,mjs}`,
      ...options,
    ])
    .catch((err) => {
      logHelper.error(err);
      throw new Error(`[Workbox Error Msg] 'gulp test' discovered errors.`);
    })
    .then(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });
  };
};

gulp.task('test:node:prod', gulp.series(
  runNodeTestsWithEnv('production'),
));

gulp.task('test:node:dev', gulp.series(
  runNodeTestsWithEnv('dev'),
));

gulp.task('test:node', gulp.series(
  'test:node:dev',
  'test:node:prod',
));

gulp.task('test', gulp.series(
  'build',
  'test:node',
  'lint'
));
