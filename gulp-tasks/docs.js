const fs = require('fs-extra');
const path = require('path');
const gulp = require('gulp');
const getNpmCmd = require('./utils/get-npm-cmd');
const browserSync = require('browser-sync').create();

const spawn = require('./utils/spawn-promise-wrapper');
const logHelper = require('../infra/utils/log-helper');

const DOCS_DIRECTORY = path.join(__dirname, '..', 'docs');

gulp.task('docs:clean', () => {
  return fs.remove(DOCS_DIRECTORY);
});

gulp.task('docs:build', gulp.series([
  'docs:clean',
  () => {
    logHelper.log(`Building docs...`);
    return spawn(getNpmCmd(), [
      'run', 'local-jsdoc', '--',
      '-c', path.join(__dirname, '..', 'jsdoc.conf'),
      '-d', DOCS_DIRECTORY,
    ])
    .then(() => {
      logHelper.log(`Docs built successfully`);
      browserSync.reload();
    })
    .catch((err) => {
      logHelper.error(`Docs failed to build: `, err);
      throw err;
    });
  },
]));

gulp.task('docs:watch', () => {
  const watcher = gulp.watch('packages/**/*',
    gulp.series(['docs:build']));
  watcher.on('error', (err) => {
    logHelper.error(`Docs failed to build: `, err);
  });
});

gulp.task('docs:serve', () => {
  browserSync.init({
    server: {
        baseDir: DOCS_DIRECTORY,
    },
  });
});

gulp.task('docs', gulp.series([
  'docs:build',
  gulp.parallel(['docs:serve', 'docs:watch']),
]));
