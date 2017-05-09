---
layout: index
title: sw-build
navigation_weight: 2
---

# sw-build

Get a precaching service worker in about ten minutes with the `sw-build` module.
Simply install the module, then cut and paste one of the provided code samples
into your build script.

## Install

1. [Install Node.js](https://nodejs.org/en/).
1. Install the module with NPM.

   ```
   npm install --save-dev sw-build
   ```

1. Require `sw-build` in your build script.

   ```
   const swBuild = require('sw-build');
   ```

## Generating a Service Worker

### gulp

Add the following to your `gulpfile.js`:

    gulp.task('build', () => {
      const swBuild = require('sw-build');

      return swBuild.generateSW({
        rootDirectory: './build/',
        swDest: './build/sw.js',
        globPatterns: ['**\/*.{html,js,css}'],
        globIgnores: ['admin.html'],
        templatedUrls: {
          '/shell': ['shell.hbs', 'main.css', 'shell.css'],
        },
      })
      .then(() => {
        console.log('Service worker generated.');
      })
      .catch((err) => {
        console.log('[ERROR] This happened: ' + err);
      });
    })

### npm

Add the following to


```
// code
```

### webpack

Add the following to


```
// code
```
