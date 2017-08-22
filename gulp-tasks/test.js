const gulp = require('gulp');
const oneLine = require('common-tags').oneLine;
const spawn = require('./utils/spawn-promise-wrapper');

const packageRunnner = require('./utils/package-runner');
const logHelper = require('./utils/log-helper');
const pkgPathToName = require('./utils/pkg-path-to-name');

const runNodeTests = (packagePath, buildType) => {
  logHelper.log(oneLine`
    Running Node Tests for
    ${logHelper.highlight(pkgPathToName(packagePath))}.
  `);
  return spawn('npm', ['run', 'test'])
  .catch((err) => {
    logHelper.error(err);
    throw new Error(`[Workbox Error Msg] 'gulp test' discovered errors.`);
  });
};

gulp.task('test:node', gulp.series(
  packageRunnner('test:node [bundled tests]', runNodeTests)
));

gulp.task('test', gulp.series(
  'test:node',
  'lint'
));
