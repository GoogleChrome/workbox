const gulp = require('gulp');
const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');

const constants = require('./utils/constants');
const getNpmCmd = require('./utils/get-npm-cmd');
const spawn = require('./utils/spawn-promise-wrapper');

const groupBuildFiles = async () => {
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
};
groupBuildFiles.displayName = 'demos:groupBuildFiles';

const firebaseServeLocal = () => {
  process.env.WORKBOX_DEMO_ENV = 'local';
  return spawn(getNpmCmd(), [
    'run', 'demos-serve',
  ]);
};
firebaseServeLocal.displayName = 'demos:firebaseServe:local';

const firebaseServeCdn = () => {
  process.env.WORKBOX_DEMO_ENV = 'cdn';
  return spawn(getNpmCmd(), [
    'run', 'demos-serve',
  ]);
};
firebaseServeCdn.displayName = 'demos:firebaseServe:cdn';

const serveLocal = gulp.series(
  groupBuildFiles,
  firebaseServeLocal,
);
serveLocal.displayName = 'demos:serve:local';

// GULP: This is never used?
const serveCdn = gulp.series(
  groupBuildFiles,
  firebaseServeCdn,
);
serveCdn.displayName = 'demos:serve:cdn';

// GULP: Why is series used here?
// GULP: This is never used?
const demosCdn = gulp.series(
  // GULP: Why is this serveLocal?
  serveLocal,
);
demosCdn.displayName = 'demos:cdn';

// GULP: Why is series used here?
const demos = gulp.series(
  serveLocal
);
demos.displayName = 'demos';

module.exports = demos;
