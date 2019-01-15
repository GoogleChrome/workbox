/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const ol = require('common-tags').oneLine;


const checkURLCasing = (options) => {
  const oldToNewOptionNames = {
    dontCacheBustUrlsMatching: 'dontCacheBustURLsMatching',
    ignoreUrlParametersMatching: 'ignoreURLParametersMatching',
    modifyUrlPrefix: 'modifyURLPrefix',
    templatedUrls: 'templatedURLs',
  };

  const warnings = [];
  for (const [oldOption, newOption] of Object.entries(oldToNewOptionNames)) {
    if (oldOption in options) {
      warnings.push(ol`The '${oldOption}' option has been renamed to
          '${newOption}'. Please update your config. '${oldOption}' is now
          deprecated and will be removed in a future release of Workbox.`);

      // Rename the option so the config will be valid.
      options[newOption] = options[oldOption];
      delete options[oldOption];
    }
  }
  return warnings;
};


const checkStrategyClasses = (options) => {
  const oldToNewOptionValues = {
    cacheFirst: 'CacheFirst',
    cacheOnly: 'CacheOnly',
    networkFirst: 'NetworkFirst',
    networkOnly: 'NetworkOnly',
    staleWhileRevalidate: 'StaleWhileRevalidate',
  };

  const warnings = [];
  if (options.runtimeCaching) {
    for (const entry of options.runtimeCaching) {
      if (typeof entry.handler === 'string' &&
          oldToNewOptionValues.hasOwnProperty(entry.handler)) {
        const oldValue = entry.handler;
        const newValue = oldToNewOptionValues[entry.handler];

        warnings.push(ol`Specifying '${oldValue}'' in a
          'runtimeCaching[].handler' option is deprecated. Please update your
          config to use '${newValue}' instead. In v4 Workbox strategies are now
          classes instead of functions.`);

        // Set the new value so the config will be valid.
        entry.handler = newValue;
      }
    }
  }
  return warnings;
};

module.exports = (options) => {
  return [
    ...checkURLCasing(options),
    ...checkStrategyClasses(options),
  ];
};
