---
layout: index
title: sw-build
navigation_weight: 2
---

# sw-build

If you want to build and configure service workers in a node script then use
`sw-build`.

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

In your build script, such as a `gulpfile.js` for example, add code similar to
the following:

    const swBuild = require('sw-build');

    swBuild.generateFileManifest({
      rootDirectory: './build/',
      dest: './build/scripts/manifest.js',
      globPatterns: ['**\/*.{html,js,css}'],
      globIgnores: ['service-worker.js','admin.html'],
      templatedUrls: {
        '/shell': ['shell.hbs', 'main.css', 'shell.css'],
      },
    })
    .then(() => {
      console.log('Build file has been created.');
    });