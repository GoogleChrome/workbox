const path = require('path');
const glob = require('glob');
const oneLine = require('common-tags').oneLine;

const pkgPathToName = require('./pkg-path-to-name');

/*
 * This methods only purpose is to call a function with
 * the package path that needs to be acted upon.
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
 *     packageRunner(someFunction, someArg, someMoreArgs)
 *   )
 * );
 * ```
 *
 * Package runner will return an array of functions that
 * will call `someFunction` where the first argument
 * is the absolute path to a package,
 * like `/user/matt/workbox/packages/workbox-core` and
 * the remaining arguments will be whatever is passed to
 * packageRunner, in the above sample this would be
 * `someArg` and `someMoreArgs`.
 *
 * In the example above, `someFunc` would be written as:
 *
 * ```javascript
 * function someFunction(packagePath, arg1, arg2) {
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
 * gulp.series(packageRunner(someFunction))
 * gulp.parallel(packageRunner(someFunction))
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
 *   packageRunner(someFunction, true),
 *   packageRunner(someFunction, false),
 * )
 * ```
 *
 * If we run the above, it would call `someFunction` for all
 * packages in workbox twice, once with argument `true` and
 * once with `false`. `gulp.parallel` will run all of these
 * calls to `someFunction` in parallel.
 */
module.exports = (displayName, func, ...args) => {
  const packagePaths = glob.sync(
    `packages/${global.packageOrStar}/package.json`, {
      absolute: true,
    }
  );

  // `packageRoots` is an array of absolute paths to packages
  // that should have func run against them.
  const packageRoots = packagePaths.map((packagePath) =>
    path.dirname(packagePath));

  return packageRoots.map((packageRootPath) => {
    const wrappedFunc = () => func(packageRootPath, ...args);
    wrappedFunc.displayName = oneLine`
      ${displayName}
      (${pkgPathToName(packageRootPath)})
      ${args.length === 0 ? '' : JSON.stringify(args)}`;
    return wrappedFunc;
  });
};
