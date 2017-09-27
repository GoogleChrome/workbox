const gulp = require('gulp');

const buildNodePackage = require('./utils/build-node-package');
const packageRunnner = require('./utils/package-runner');

gulp.task('build-node-packages', gulp.series(
  packageRunnner(
    'build-node-packages',
    'node',
    buildNodePackage
  )
));
