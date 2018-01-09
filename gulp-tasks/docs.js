const fs = require('fs-extra');
const path = require('path');
const gulp = require('gulp');
const getNpmCmd = require('./utils/get-npm-cmd');
const browserSync = require('browser-sync').create();

const spawn = require('./utils/spawn-promise-wrapper');
const logHelper = require('../infra/utils/log-helper');

const DOCS_DIRECTORY = path.join(__dirname, '..', 'docs');

const clean = () => {
  return fs.remove(DOCS_DIRECTORY);
};
clean.displayName = 'docs:clean';
// GULP: Is this exposed to the CLI?
gulp.task(clean);

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
      browserSync.reload();
    })
    .catch((err) => {
      logHelper.error(`Docs failed to build: `, err);
      throw err;
    });
  };
};

const buildDebug = gulp.series(
  clean,
  getJSDocFunc(true),
);
buildDebug.displayName = 'docs:build-debug';
// GULP: Is this exposed to the CLI?
gulp.task(buildDebug);

const build = gulp.series(
  clean,
  getJSDocFunc(false),
);
build.displayName = 'docs:build';
// GULP: Is this exposed to the CLI?
gulp.task(build);

const watch = () => {
  const watcher = gulp.watch('packages/**/*',
    gulp.series(['docs:build']));
  watcher.on('error', (err) => {
    logHelper.error(`Docs failed to build: `, err);
  });
};
watch.displayName = 'docs:watch';
// GULP: Is this exposed to the CLI?
gulp.task(watch);

const serve = () => {
  browserSync.init({
    server: {
        baseDir: DOCS_DIRECTORY,
    },
  });
};
serve.displayName = 'docs:serve';
// GULP: Is this exposed to the CLI?
gulp.task(serve);

const docs = gulp.series(
  build,
  gulp.parallel(serve, watch),
);
docs.displayName = 'docs';

module.exports = docs;
