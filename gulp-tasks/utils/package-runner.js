/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const path = require('path');
const glob = require('glob');
const oneLine = require('common-tags').oneLine;

const pkgPathToName = require('./pkg-path-to-name');

/**
 * @param {string} typeFilter The type of packages to return: 'node', 'sw',
 * or 'all'.
 * @return Array<string> Paths to package.json files for the matching packages.
 */
function getPackages(typeFilter) {
  return glob
    .sync(`packages/${global.packageOrStar}/package.json`, {
      absolute: true,
    })
    .filter((pathToPackageJson) => {
      const pkgInfo = require(pathToPackageJson);
      const packageType = pkgInfo.workbox.packageType;
      if (!packageType) {
        throw Error(oneLine`Unable to determine package type. Please add
      workbox.packageType metadata to ${pathToPackageJson}`);
      }

      return typeFilter === 'all' || typeFilter === packageType;
    });
}

/*
 * This methods only purpose is to call a function with
 * the package path that needs to be acted upon.
 *
 * The specific function might vary depending on whether a give project targets
 * Node or the browser, so you can specify 'sw', 'node', or 'all'.
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
 *     packageRunner(displayName, 'all', func, arg1, arg2)
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
 * gulp.series(packageRunner(displayName, 'all', func))
 * gulp.parallel(packageRunner(displayName, 'all', func))
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
 *   packageRunner(displayName, 'sw', func, true),
 *   packageRunner(displayName, 'sw', func, false),
 * )
 * ```
 *
 * If we run the above, it would call the appropriate
 * `func` for all packages in workbox twice, once with
 * argument `true` and once with `false`. `gulp.parallel` will run all of these
 * calls to `func` in parallel.
 *
 * @param {string} displayName A friendly name to log.
 * @param Array<string> The type of package we want to run func against:
 * 'node', 'sw', or 'all'.
 * @param {function} func The function that we want to run for each package.
 * @param {*} args Any arguments that should be passed in to the func.
 * @return Array<function> All of the function wrappers.
 */
module.exports = (displayName, packageType, func, ...args) => {
  const packagePaths = getPackages(packageType);
  // We need to return a single no-op rather than an empty array, or else gulp
  // will throw 'One or more tasks should be combined using series or parallel'.
  if (packagePaths.length === 0) {
    const noOp = (done) => done();
    noOp.displayName = displayName;
    return [noOp];
  }
  return packagePaths.map((packagePath) => {
    const packageRootPath = path.dirname(packagePath);

    const wrappedFunc = () => func(packageRootPath, ...args);
    wrappedFunc.displayName = oneLine`
      ${displayName}
      (${pkgPathToName(packageRootPath)})
      ${args.length === 0 ? '' : JSON.stringify(args)}`;
    return wrappedFunc;
  });
};
