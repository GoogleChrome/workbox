const gulp = require('gulp');
const header = require('gulp-header');

const constants = require('./constants');
const pkgPathToName = require('./pkg-path-to-name');
const versioning = require('../../infra/utils/versioning');

module.exports = (packagePath, buildType) => {
  return gulp.src([
    `${packagePath}/**/*.mjs`,
    `!${packagePath}/{${constants.PACKAGE_BUILD_DIRNAME},` +
      `${constants.PACKAGE_BUILD_DIRNAME}/**}`,
    `!**/node_modules/**`,
  ])
  .pipe(header(`${versioning(pkgPathToName(packagePath))}\n\n`))
  .pipe(gulp.dest(`${packagePath}/${constants.PACKAGE_BUILD_DIRNAME}/` +
    `${constants.MODULE_BUILD_DIRNAME}`));
};
