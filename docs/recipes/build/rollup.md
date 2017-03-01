# [Rollup](https://github.com/rollup/rollup) Bundling

## Dependencies

- A working installation of `node` (4.0+) & `npm`.
- `npm install --save-dev sw-build sw-lib rollup rollup-plugin-node-resolve`

## Service Worker Code

This approach assumes that your `src/sw.js` file is using [ES2015 module
import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
syntax, and is structured like:

```js
// Contents of src/sw.js:

import manifest from '/tmp/manifest.js';
import swLib from 'sw-lib';
// import other libraries, e.g. idb-keyval, Firebase Messaging, etc.

swLib.cacheRevisionedAssets(manifest);

// Additional runtime service worker logic goes here.
```

## Option 1: Vanilla node Build Script

The following is a basic `node` build script that can be run as part of a larger
build process, e.g. in `package.json` at the end of an
[`npm scripts`](https://docs.npmjs.com/misc/scripts) `"build"` chain as
`&& node build-sw.js`.

**Note:** Make sure that this code runs last in the build chain, so that it
picks up all the ready-to-deploy files that have been copied to your `build/`
directory.

```js
// Contents of build-sw.js:

const resolve = require('rollup-plugin-node-resolve');
const rollup = require('rollup').rollup;
const swBuild = require('sw-build');

// Adjust with appropriate paths to your source and output directories.
const SRC_DIR = 'src';
const BUILD_DIR = 'build';

const swBuildConfig = {
  // The dest: option should match the path for manifest.js you provide in your
  // unbundled service worker file.
  dest: '/tmp/manifest.js',
  // Configure patterns to match the files your want the SW to manage.
  // See https://github.com/isaacs/node-glob##glob-primer
  globPatterns: [
    `./${BUILD_DIR}/{css,images,js}/**/*`,
    `./${BUILD_DIR}/index.html`,
  ],
  rootDirectory: BUILD_DIR,
  format: 'es',
};

const rollupConfig = {
  // This should point to your unbundled service worker code.
  entry: `${SRC_DIR}/sw.js`,
  plugins: [resolve({
    jsnext: true,
    main: true,
    browser: true,
  })],
};

const bundleConfig = {
  format: 'iife',
  dest: `${BUILD_DIR}/sw.js`,
};

// manifest generation ->
//   rollup configuration ->
//   write bundle to disk
swBuild.generateFileManifest(swBuildConfig)
  .then(() => rollup(rollupConfig))
  .then((bundle) => bundle.write(bundleConfig));

```

## Option 2: [gulp](http://gulpjs.com/) Tasks

The same basic code can be split up into two separate `gulp` tasks, if you
already are using that for your build process.

**Note:** As with before, make sure that you run the `write-sw` task at the very
end of your `gulp` task chain, to ensure that it picks up the final,
ready-to-deploy files in your `build/` directory.

```js
const gulp = require('gulp');
const resolve = require('rollup-plugin-node-resolve');
const rollup = require('rollup').rollup;
const swBuild = require('sw-build');

// Adjust with appropriate paths to your source and output directories.
const SRC_DIR = 'src';
const BUILD_DIR = 'build';

gulp.task('write-manifest', () => {
  return swBuild.generateFileManifest({
    // The dest: option should match the path for manifest.js you provide in your
    // unbundled service worker file.
    dest: `/tmp/manifest.js`,
    // Configure patterns to match the files your want the SW to manage.
    // See https://github.com/isaacs/node-glob##glob-primer
    globPatterns: [
      `./${BUILD_DIR}/{css,images,js}/**/*`,
      `./${BUILD_DIR}/index.html`,
    ],
    rootDirectory: BUILD_DIR,
    format: 'es',
  });
});

gulp.task('write-sw', ['write-manifest'], () => {
  return rollup({
    // This should point to your unbundled service worker code.
    entry: `${SRC_DIR}/sw.js`,
    plugins: [resolve({
      jsnext: true,
      main: true,
      browser: true,
    })],
  }).then((bundle) => bundle.write({
    dest: `${BUILD_DIR}/sw.js`,
    format: 'iife',
  }));
});
```
