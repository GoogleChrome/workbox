const gulp = require('gulp');
const path = require('path');
const fs = require('fs-extra');
const oneLine = require('common-tags').oneLine;
const rollup = require('rollup-stream');
const source = require('vinyl-source-stream');

const constants = require('./utils/constants');
const packageRunnner = require('./utils/package-runner');
const logHelper = require('./utils/log-helper');
const pkgPathToName = require('./utils/pkg-path-to-name');

const buildPackage = (packagePath) => {
  const srcPath = path.posix.join(packagePath, 'src');
  const browserBundlePath = path.posix.join(srcPath, 'browser-bundle.js');

  // First check if the bundle directory exists, if it doesn't
  // there is nothing to build (NOTE: Rollup + multientry will
  // always create a file, even if the directory doesn't exist)
  if (!fs.pathExistsSync(browserBundlePath)) {
    logHelper.Error(oneLine`
      Could not find the browser bundle for${pkgPathToName(packagePath)}.
    `);
    return Promise.reject(oneLine`
      Could not find the browser bundle for ${pkgPathToName(packagePath)}.
    `);
  }

  logHelper.log(oneLine`
    Building Browser Bundle for
    ${logHelper.highlight(pkgPathToName(packagePath))}.
  `);

  const plugins = [
    // No plugins are needed at present apart from the optional replace plugin.
    //
    // !!! ATTENTION !!!
    //
    // Before adding a plugin, give serious consideration as to where it
    // is the best option. It will complicate the build and could have
    // adverse affects on file size.
  ];

  let outputFilename = `${pkgPathToName(packagePath)}-dev.js`;

  /** if (nodeEnv) {
    // Make a unique bundle file for this environment
    outputFilename = path.fileNameWithPostfix(outputFilename, `.${nodeEnv}`);
    // Replace allows us to input NODE_ENV and strip code accordingly
    plugins.push(replace({
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    }));
  }**/

  const namespace = `google.${pkgPathToName(packagePath).replace('-', '.')}`;

  return rollup({
    entry: browserBundlePath,
    format: 'iife',
    moduleName: namespace,
    sourceMap: true,
    plugins,
    onwarn: (warning) => {
      // The final builds should have no warnings.
      logHelper.error(`Unable to resolve import. `, warning.message);
      throw new Error(`Unable to resolve import. ${warning.message}`);
    },
  })
  // This gives the generated stream a file name
  .pipe(source(outputFilename))
  .pipe(gulp.dest(
    path.posix.join(packagePath, constants.BUILD_DIRNAME, 'browser-bundles')
  ));
};

gulp.task('build-package', gulp.series(
  packageRunnner('build-package', buildPackage)
));
