const path = require('path');
const glob = require('glob');
const oneLine = require('common-tags').oneLine;

const constants = require('./constants');
const pkgPathToName = require('./pkg-path-to-name');

const getProjectType = (pathToPackageJson) => {
  const pkgInfo = require(pathToPackageJson);
  // Let's assume that if engines.node is set in the project's package.json then
  // it's a Node project.
  return pkgInfo.engines && pkgInfo.engines.node ?
    constants.PROJECT_TYPES.NODE :
    constants.PROJECT_TYPES.BROWSER;
};

/*
 * This methods only purpose is to call a function with
 * the package path that needs to be acted upon.
 *
 * The specific function might vary depending on whether a give project targets
 * Node or the browser, so `functionForEachProjectType` maps each of those
 * project types to the appropriate function.
 *
 * If we ran gulp as `gulp build` we would want the
 * 'build' task to run against all packages.
 *
 * If we ran gulp as `gulp build --project workbox-core`
 * we would want the 'build' task to run against `workbox-core`
 * **only**.
 *
 * This method simplifies how we would write the 'build'
 * task and should be the only way we write functions.
 *
 * ```javascript
 * gulp.task('build',
 *   gulp.series(
 *     packageRunner(displayName, functionForEachProjectType, arg1, arg2)
 *   )
 * );
 * ```
 *
 * Package runner will return an array of functions that
 * will call `functionForEachProjectType` where the first argument
 * is the absolute path to a package,
 * like `/user/matt/workbox/packages/workbox-core` and
 * the remaining arguments will be whatever is passed to
 * packageRunner, in the above sample this would be
 * `someArg` and `someMoreArgs`.
 *
 * In the example above, `someFunc` would be written as:
 *
 * ```javascript
 * function functionForEachProjectType(packagePath, arg1, arg2) {
 *   // Return a Promise
 *   return Promise.resolve().then(() => ...)
 *
 *   // OR
 *
 *   // Return a gulp stream
 *   return gulp.src(path.posix.join(packagePath, 'example-dir', '*.js'))
 *   .pipe(...)
 *   .pipe(gulp.dest(...));
 * }
 * ```
 *
 * You can use this with both `gulp.series` and
 * `gulp.parallel`.
 *
 * ```javascript
 * gulp.series(packageRunner(displayName, functionForEachProjectType))
 * gulp.parallel(packageRunner(displayName, functionForEachProjectType))
 * ```
 *
 * If you need to call the runner with multiple functions
 * you can do this and gulp will merge the arrays returned
 * by the runner.
 *
 * For example:
 *
 * ```javascript
 * gulp.parallel(
 *   packageRunner(displayName, functionForEachProjectType, true),
 *   packageRunner(displayName, functionForEachProjectType, false),
 * )
 * ```
 *
 * If we run the above, it would call the appropriate
 * `functionForEachProjectType` for all packages in workbox twice, once with
 * argument `true` and once with `false`. `gulp.parallel` will run all of these
 * calls to `functionForEachProjectType` in parallel.
 */
module.exports = (displayName, funcsForProjectTypes, ...args) => {
  const packagePaths = glob.sync(
    `packages/${global.packageOrStar}/package.json`, {
      absolute: true,
    }
  );

  return packagePaths.map((packagePath) => {
    const projectType = getProjectType(packagePath);
    const func = funcsForProjectTypes[projectType];
    if (!func) {
      return;
    }
    const packageRootPath = path.dirname(packagePath);

    const wrappedFunc = () => func(packageRootPath, ...args);
    wrappedFunc.displayName = oneLine`
      ${displayName}
      (${pkgPathToName(packageRootPath)})
      ${args.length === 0 ? '' : JSON.stringify(args)}`;
    return wrappedFunc;
  }).filter((func) => typeof func === 'function');
};
