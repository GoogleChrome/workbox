/* eslint-disable no-console */

const swBuild = require('sw-build');

swBuild.generateFileManifest({
  dest: './build/manifest.js',
  rootDirectory: './build/',
  globPatterns: ['**\/*.{html,js,css}'],
  globIgnores: ['admin.html'],
})
.then(() => {
  console.log('File manifest has been created.');
});
