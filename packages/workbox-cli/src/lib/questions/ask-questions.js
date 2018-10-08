/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const askConfigLocation = require('./ask-config-location');
const askExtensionsToCache = require('./ask-extensions-to-cache');
const askRootOfWebApp = require('./ask-root-of-web-app');
const askSWDest = require('./ask-sw-dest');
const askSWSrc = require('./ask-sw-src');

module.exports = async (options = {}) => {
  const globDirectory = await askRootOfWebApp();
  const globPatterns = await askExtensionsToCache(globDirectory);
  const swSrc = options.injectManifest ? await askSWSrc() : undefined;
  const swDest = await askSWDest(globDirectory);
  const configLocation = await askConfigLocation();
  const config = {
    globDirectory,
    globPatterns,
    swDest,
    swSrc,
  };

  return {
    config,
    configLocation,
  };
};
