const gulp = require('gulp');
const path = require('path');
const fs = require('fs-extra');

const constants = require('./utils/constants');

const lernaPath = path.join(__dirname, '../lerna.json');
let lernaVersion;

// The get-current-version and check-version tasks exist incase the user
// skips / ctrl + c's the first lerna publish command
gulp.task('publish:get-current-version', () => {
  const lernaPkg = JSON.parse(fs.readFileSync(lernaPath).toString());
  lernaVersion = lernaPkg.version;
  return Promise.resolve();
});

gulp.task('publish:check-version', () => {
  // Read file from filesystem to avoid require caching
  const lernaPkg = JSON.parse(fs.readFileSync(lernaPath).toString());
  if (lernaPkg.version === lernaVersion) {
    return Promise.reject(`Lerna version wasn't updated.`);
  }
  return Promise.resolve();
});

gulp.task('publish:clean', () => {
  return fs.remove(path.join(__dirname, '..',
    constants.GENERATED_RELEASE_FILES_DIRNAME));
});

gulp.task('publish:cdn+git', gulp.series([
  'publish:clean',
  'publish-github',
  'publish-cdn',
]));

gulp.task('publish', gulp.series([
  'test',
  'publish:get-current-version',
  'publish-lerna:no-push',
  'publish:check-version',
  'publish-lerna:push',
  'publish:cdn+git',
]));
