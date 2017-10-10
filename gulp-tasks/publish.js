const gulp = require('gulp');
const path = require('path');
const fs = require('fs-extra');

const constants = require('./utils/constants');

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
  'publish-lerna',
  'publish:cdn+git',
]));
