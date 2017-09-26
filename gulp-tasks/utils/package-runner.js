const path = require('path');
const glob = require('glob');
const oneLine = require('common-tags').oneLine;

const pkgPathToName = require('./pkg-path-to-name');

/**
 * @param {string} [typeFilter] If provided, only return packages whose
 * workbox.packageType field matches this value.
 * @return Array<string> Paths to package.json files for the matching packages.
 */
function getPackages(typeFilter) {
  return glob.sync(
    `packages/${global.packageOrStar}/package.json`, {
      absolute: true,
    }
  ).filter((pathToPackageJson) => {
    const pkgInfo = require(pathToPackageJson);
    const packageType = pkgInfo.workbox.packageType;
    if (!packageType) {
      throw Error(oneLine`Unable to determine package type. Please add
      workbox.packageType metadata to ${pathToPackageJson}`);
    }

    return typeFilter ?
      // If typeFilter is specified, check to see if we care about this package.
      typeFilter === packageType :
      // Otherwise, just return true, so all packages are included.
      true;
  });
}

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
 *     packageRunner(displayName, packagePaths, func, arg1, arg2)
 *   )
 * );
 * ```
 *
 * Package runner will return an array of functions that
 * will call `func` where the first argument
 * is the absolute path to a package,
 * like `/user/matt/workbox/packages/workbox-core` and
 * the remaining arguments will be whatever is passed to
 * packageRunner, in the above sample this would be
 * `arg1` and `arg2`.
 *
 * In the example above, `func` would be written as:
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
 * gulp.series(packageRunner(displayName, packagePaths, func))
 * gulp.parallel(packageRunner(displayName, packagePaths, func))
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
 *   packageRunner(displayName, packagePaths, func, true),
 *   packageRunner(displayName, packagePaths, func, false),
 * )
 * ```
 *
 * If we run the above, it would call the appropriate
 * `func` for all packages in workbox twice, once with
 * argument `true` and once with `false`. `gulp.parallel` will run all of these
 * calls to `func` in parallel.
 *
 * @param {string} displayName A friendly name to log.
 * @param Array<string> packagePaths Paths to package.json files corresponding
 * to all the packages we want to run func against.
 * @param {function} func The function that we want to run for each package.
 * @param {*} args Any arguments that should be passed in to the func.
 * @return Array<function> All of the function wrappers.
 */
function wrapFunction(displayName, packagePaths, func, ...args) {
  return packagePaths.map((packagePath) => {
    const packageRootPath = path.dirname(packagePath);

    const wrappedFunc = () => func(packageRootPath, ...args);
    wrappedFunc.displayName = oneLine`
      ${displayName}
      (${pkgPathToName(packageRootPath)})
      ${args.length === 0 ? '' : JSON.stringify(args)}`;
    return wrappedFunc;
  });
}

module.exports = {
  getPackages,
  wrapFunction,
};
