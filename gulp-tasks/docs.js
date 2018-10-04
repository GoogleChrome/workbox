const fs = require('fs-extra');
const path = require('path');
const gulp = require('gulp');
const getNpmCmd = require('./utils/get-npm-cmd');

const spawn = require('./utils/spawn-promise-wrapper');
const logHelper = require('../infra/utils/log-helper');

const DOCS_DIRECTORY = path.join(__dirname, '..', 'docs');

gulp.task('docs:clean', () => {
  return fs.remove(DOCS_DIRECTORY);
});

const getJSDocFunc = (debug) => {
  return () => {
    logHelper.log(`Building docs...`);
    const queryString = [
      `projectRoot=/`,
      `basepath=/`,
      `productName=Workbox`,
    ].join('&');

    const params = [
      'run', 'local-jsdoc', '--',
      '-c', path.join(__dirname, '..', 'jsdoc.conf'),
      '-d', DOCS_DIRECTORY,
    ];


    if (!global.cliOptions.pretty) {
      logHelper.warn(`

These docs will look ugly, but they will more accurately match what
is shown on developers.google.com.

You can view a friendlier UI by running

  'gulp docs --pretty'
`);
      params.push(
          '--template', path.join(
              __dirname, '..', 'infra', 'templates', 'reference-docs', 'jsdoc'
          ),
          '--query', queryString,
      );
    }

    if (debug) {
      params.push('--debug');
    }

    return spawn(getNpmCmd(), params, {
      cwd: path.join(__dirname, '..'),
    })
        .then(() => {
          logHelper.log(`Docs built successfully`);
        })
        .catch((err) => {
          logHelper.error(`Docs failed to build: `, err);
          throw err;
        });
  };
};

gulp.task('docs:build-debug', gulp.series([
  'docs:clean',
  getJSDocFunc(true),
]));

gulp.task('docs:build', gulp.series([
  'docs:clean',
  getJSDocFunc(false),
]));

gulp.task('docs:watch', () => {
  const watcher = gulp.watch('packages/**/*',
      gulp.series(['docs:build']));
  watcher.on('error', (err) => {
    logHelper.error(`Docs failed to build: `, err);
  });
});

gulp.task('docs', gulp.series([
  'docs:build',
  'docs:watch',
]));
