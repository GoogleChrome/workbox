/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

module.exports = (config) => {
  const moreInfoUrl = 'https://goo.gl/EQ4Rhm';

  const globOptions = [
    'globDirectory',
    'globFollow',
    'globIgnores',
    'globPatterns',
    'globStrict',
  ];

  const usedGlobOptions = globOptions.filter((option) => option in config);
  if (usedGlobOptions.length > 0) {
    return `You're using the following Workbox configuration option` +
      `${usedGlobOptions.length === 1 ? '' : 's'}: ` +
      `[${usedGlobOptions.join(', ')}]. In Workbox v3 and later, this is ` +
      `usually not needed. Please see ${moreInfoUrl} for more info.`;
  }

  const optionsToWarnAboutWhenGlobPatternsIsNotSet = [
    'dontCacheBustUrlsMatching',
    'manifestTransforms',
    'maximumFileSizeToCacheInBytes',
    'modifyUrlPrefix',
  ];

  const usedNoopOptions = optionsToWarnAboutWhenGlobPatternsIsNotSet
      .filter((option) => option in config);
  if (usedNoopOptions.length > 0) {
    return `You're using the following Workbox configuration option` +
      `${usedGlobOptions.length === 1 ? '' : 's'}: ` +
      `[${usedNoopOptions.join(', ')}]. This will not have any effect, as ` +
      `it will only modify files that are matched via 'globPatterns'. You ` +
      `can remove them from your config, and learn more at ${moreInfoUrl}`;
  }

  return null;
};
