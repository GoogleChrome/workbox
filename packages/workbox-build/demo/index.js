/* eslint-disable no-console */

const workboxBuild = require('../build/index');

workboxBuild.generateSW({
  globDirectory: '../build/',
  globPatterns: ['**\/*.{html,js,css}'],
  globIgnores: ['service-worker.js', 'admin.html'],
  swDest: './sw.js',
}).then(() => {
  console.log('Service worker generated.');
});
