---
layout: page
title: Recipes > Rollup Bundling
---

# Rollup Bundling

These recipes cover the following `sw-lib` use case:
- You want to write and maintain your own `sw.js` file that uses precaching via
`sw-lib.precache()` alongside other service worker logic.
- You'd like to use [ES2015 import syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
to include `sw-lib` and other modules into your service worker.
- You are comfortable using [`Rollup`](https://github.com/rollup/rollup) to
handle transforming the `sw.js` file you maintain into a production-ready,
self contained service worker file, containing the `sw-lib` library code along
with your custom logic.
- You are comfortable using either [`gulp`](http://gulpjs.com/) or
[`npm scripts`](https://docs.npmjs.com/misc/scripts) as a task runner for your
build process.

## Dependencies

- Working installations of `node` (4.0+) & `npm`.
- `npm install --save-dev sw-build sw-lib rollup rollup-plugin-node-resolve`

## Service Worker Code

This approach assumes that you have a `src/sw.js` that uses [ES2015 module
import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
syntax, and is structured like:

```js
// Contents of src/sw.js:

// manifest.js will be created by sw-build; see the next section for details.
import manifest from '/tmp/manifest.js';
import swLib from 'sw-lib';
// imports for any other libraries, e.g. idb-keyval, Firebase Messaging, etc.

// This will precache the files in your manifest, and keep them up to date.
swLib.precache(manifest);

// Any additional runtime service worker logic can go here.
```

## Your Build Process

There are many different ways of running build tasks, and they can't be listed
exhaustively. Here are recipes that cover two possible approaches, producing the
same ready-to-use service worker as output. You can choose between them based on
whether you'd prefer using `npm scripts` or `gulp` as your task runner.

**Note:** Regardless of which task runner you're using, make sure that the
generation of the service worker file happens *last* in the chain of your build
tasks. This ensures that the service worker looks at the final contents of your
`build/` directory when determining which files to precache and keep up to date.

### npm scripts

The following is a basic `node` script that can be run as part of a larger build
process, e.g. in `package.json` at the end of an
[`npm scripts`](https://docs.npmjs.com/misc/scripts) `"build"` chain, like:
`"scripts": {"build": "node build.js && node build-sw.js"}`

```js
// Contents of build-sw.js:

const resolve = require('rollup-plugin-node-resolve');
const rollup = require('rollup').rollup;
const swBuild = require('sw-build');

// Adjust with appropriate paths to your source and output directories.
const SRC_DIR = 'src';
const BUILD_DIR = 'build';

// The promise chain can be summarized as:
//   manifest generation -> rollup configuration -> write bundle to disk
swBuild.generateFileManifest({
 // The swDest: option should match the path for manifest.js you provide in your
 // unbundled service worker file.
 swDest: '/tmp/manifest.js',
 // Configure patterns to match the files your want the SW to manage.
 // See https://github.com/isaacs/node-glob##glob-primer
 staticFileGlobs: [
   `./${BUILD_DIR}/{css,images,js}/**/*`,
   `./${BUILD_DIR}/index.html`,
 ],
 globDirectory: BUILD_DIR,
 format: 'es',
}).then(() => rollup({
 // This should point to your unbundled service worker code.
 entry: `${SRC_DIR}/sw.js`,
 plugins: [resolve({
   jsnext: true,
   main: true,
   browser: true,
 })],
})).then((bundle) => bundle.write({
 format: 'iife',
 swDest: `${BUILD_DIR}/sw.js`,
}));
```

### gulp Tasks

The same basic approach can be run via two `gulp` tasks, if you prefer using
`gulp` to run build tasks:

```js
const gulp = require('gulp');
const resolve = require('rollup-plugin-node-resolve');
const rollup = require('rollup').rollup;
const swBuild = require('sw-build');

// Adjust with appropriate paths to your source and output directories.
const SRC_DIR = 'src';
const BUILD_DIR = 'build';

// This task should be invoked as a dependency of bundle-sw.
gulp.task('write-manifest', () => {
  return swBuild.generateFileManifest({
    // The swDest: option should match the path for manifest.js you provide in your
    // unbundled service worker file.
    swDest: `/tmp/manifest.js`,
    // Configure patterns to match the files your want the SW to manage.
    // See https://github.com/isaacs/node-glob##glob-primer
    staticFileGlobs: [
      `./${BUILD_DIR}/{css,images,js}/**/*`,
      `./${BUILD_DIR}/index.html`,
    ],
    globDirectory: BUILD_DIR,
    format: 'es',
  });
});

// ['write-manifest'] defines that task as a dependency, so running the
// bundle-sw task will always invoke write-manifest first.
gulp.task('bundle-sw', ['write-manifest'], () => {
  return rollup({
    // This should point to your unbundled service worker code.
    entry: `${SRC_DIR}/sw.js`,
    plugins: [resolve({
      jsnext: true,
      main: true,
      browser: true,
    })],
  }).then((bundle) => bundle.write({
    swDest: `${BUILD_DIR}/sw.js`,
    format: 'iife',
  }));
});
```
