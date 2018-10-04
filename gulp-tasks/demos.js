const gulp = require('gulp');
const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');

const constants = require('./utils/constants');
const getNpmCmd = require('./utils/get-npm-cmd');
const spawn = require('./utils/spawn-promise-wrapper');

gulp.task('demos:groupBuildFiles', async () => {
  const pattern = path.posix.join(
      __dirname, '..', 'packages', '**',
      constants.PACKAGE_BUILD_DIRNAME, '*.{js,map}');

  const localBuildPath = path.join(__dirname, '..', 'demos', 'public',
      constants.LOCAL_BUILDS_DIR);
  await fs.remove(localBuildPath);
  await fs.ensureDir(localBuildPath);

  // Copy files from the source code and move into the grouped build
  // directory. In others, have a flat file structure of just the built files.
  const filesToIncludeInBundle = glob.sync(pattern);
  for (const fileToInclude of filesToIncludeInBundle) {
    await fs.ensureSymlink(
        fileToInclude,
        path.join(localBuildPath, path.basename(fileToInclude)),
    );
  }
});

gulp.task('demos:firebaseServe:local', () => {
  process.env.WORKBOX_DEMO_ENV = 'local';
  return spawn(getNpmCmd(), [
    'run', 'demos-serve',
  ]);
});

gulp.task('demos:firebaseServe:cdn', () => {
  process.env.WORKBOX_DEMO_ENV = 'cdn';
  return spawn(getNpmCmd(), [
    'run', 'demos-serve',
  ]);
});

gulp.task('demos:serve:local', gulp.series([
  'demos:groupBuildFiles',
  'demos:firebaseServe:local',
]));

gulp.task('demos:serve:cdn', gulp.series([
  'demos:groupBuildFiles',
  'demos:firebaseServe:cdn',
]));

gulp.task('demos:cdn', gulp.series([
  'demos:serve:local',
]));

gulp.task('demos', gulp.series([
  'demos:serve:local',
]));
