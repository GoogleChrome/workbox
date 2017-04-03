/* eslint-disable no-console */

const swBuild = require('../build/index');

swBuild.generateFileManifest({
  dest: './build/manifest.js',
  rootDirectory: './build/',
  staticFileGlobs: ['**/*.{html,js,css}'],
  globIgnores: ['admin.html'],
})
.then(() => {
  console.log('File manifest has been created.');
});
