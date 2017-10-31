const buffer = require('vinyl-buffer');
const fs = require('fs-extra');
const gulp = require('gulp');
const oneLine = require('common-tags').oneLine;
const path = require('path');
const rename = require('gulp-rename');
const rollup = require('rollup');
const rollupStream = require('rollup-stream');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const constants = require('./constants');
const pkgPathToName = require('./pkg-path-to-name');
const rollupHelper = require('./rollup-helper');
const logHelper = require('../../infra/utils/log-helper');

/*
 * To test sourcemaps are valid and working, use:
 * http://paulirish.github.io/source-map-visualization/#custom-choose
 */
const ERROR_NO_MODULE_BROWSER = `Could not find the modules browser.mjs file: `;
const ERROR_NO_NAMSPACE = oneLine`
  You must define a 'browserNamespace' parameter in the 'package.json'.
  Example: 'workbox-precaching' would have a browserNamespace param of
  'workbox.precaching' in 'package.json', meaning developers would use
  'workbox.precaching' in their JavaScript. Please fix for:
`;

// This makes Rollup assume workbox-* will be added to the global
// scope and replace references with the core namespace
const globals = (moduleId) => {
  const splitModuleId = moduleId.split('/');
  if (splitModuleId[0].indexOf('workbox-') !== 0) {
    throw new Error(`Unknown global module ID: ${moduleId}`);
  }

  const packageName = splitModuleId.shift();
  const packagePath = path.join(__dirname, '..', '..', 'packages', packageName);
  const namespacePath = splitModuleId.map((modulePiece) => {
    // The browser namespace will need the file extension removed
    return path.basename(modulePiece, path.extname(modulePiece));
  }).join('.');

  if (splitModuleId.length === 0 || splitModuleId.length > 1) {
    // Tried to pull in default export of module - this isn't allowed.
    // A specific file must be referenced
    throw new Error(oneLine`
      You cannot use a module directly - you must specify a public top-level
      file, this is to force a best practice for tree shaking (i.e. only
      pulling in what you use). Please fix the import: '${moduleId}'
    `);
  }

  // Get a package's browserNamespace so we know where it will be
  // on the global scope (i.e. workbox.<name space>)
  try {
    const pkg = require(path.join(packagePath, 'package.json'));
    return [
      pkg.workbox.browserNamespace,
      namespacePath,
    ].join('.');
  } catch (err) {
    logHelper.error(`Unable to get browserNamespace for package: ` +
      `'${packageName}'`);
    logHelper.error(err);
    throw err;
  }
};

// This ensures all workbox-* modules are treated as external and are
// referenced as globals.
const externalAndPure = (moduleId) => (moduleId.indexOf('workbox-') === 0);

module.exports = (packagePath, buildType) => {
  const packageName = pkgPathToName(packagePath);
  const moduleBrowserPath = path.join(packagePath, `browser.mjs`);

  // First check if the bundle file exists, if it doesn't
  // there is nothing to build
  if (!fs.existsSync(moduleBrowserPath)) {
    logHelper.error(ERROR_NO_MODULE_BROWSER + packageName);
    return Promise.reject(ERROR_NO_MODULE_BROWSER + packageName);
  }

  const pkgJson = require(path.join(packagePath, 'package.json'));
  if (!pkgJson.workbox || !pkgJson.workbox.browserNamespace) {
    logHelper.error(ERROR_NO_NAMSPACE + ' ' + packageName);
    return Promise.reject(ERROR_NO_NAMSPACE + ' ' + packageName);
  }

  const namespace = pkgJson.workbox.browserNamespace;
  const outputFilename = `${packageName}.${buildType.slice(0, 4)}.js`;
  const outputDirectory = path.join(packagePath,
    constants.PACKAGE_BUILD_DIRNAME, constants.BROWSER_BUILD_DIRNAME);

  logHelper.log(oneLine`
    Building Browser Bundle for
    ${logHelper.highlight(packageName)}.
  `);
  logHelper.log(`    Namespace: ${logHelper.highlight(namespace)}`);
  logHelper.log(`    Filename: ${logHelper.highlight(outputFilename)}`);

  return rollupStream({
    input: moduleBrowserPath,
    rollup,
    format: 'iife',
    name: namespace,
    sourcemap: true,
    globals,
    external: externalAndPure,
    pureExternalModules: externalAndPure,
    plugins: rollupHelper.getDefaultPlugins(buildType),
    onwarn: (warning) => {
      if (buildType === constants.BUILD_TYPES.prod &&
        warning.code === 'UNUSED_EXTERNAL_IMPORT') {
        // This can occur when using rollup-plugin-replace.
        logHelper.warn(`[${warning.code}] ${warning.message}`);
        return;
      }

      // The final builds should have no warnings.
      throw new Error(`Unhandled Rollup Warning: [${warning.code}] ` +
        `${warning.message}`);
    },
  })
  .on('error', (err) => {
    const args = [];
    Object.keys(err).forEach((key) => {
      args.push(`${key}: ${err[key]}`);
    });
    logHelper.error(err, `\n\n${args.join('\n')}`);
    throw err;
  })
  // We must give the generated stream the same name as the entry file
  // for the sourcemaps to work correctly
  .pipe(source(moduleBrowserPath))
  // gulp-sourcemaps don't work with streams so we need
  .pipe(buffer())
  // This tells gulp-sourcemaps to load the inline sourcemap
  .pipe(sourcemaps.init({loadMaps: true}))
  // This renames the output file
  .pipe(rename(outputFilename))
  // This writes the sourcemap alongside the final build file
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(outputDirectory));
};
