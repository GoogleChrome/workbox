/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

module.exports = {
  cleanupOutdatedCaches: false,
  clientsClaim: false,
  globFollow: true,
  globIgnores: ['**/node_modules/**/*'],
  globPatterns: ['**/*.{js,css,html}'],
  globStrict: true,
  importWorkboxFrom: 'cdn',
  injectionPointRegexp: /(precacheAndRoute\()\s*\[\s*\]\s*(\)|,)/,
  maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
  navigateFallback: undefined,
  navigationPreload: false,
  offlineGoogleAnalytics: false,
  purgeOnQuotaError: false,
  skipWaiting: false,
};
