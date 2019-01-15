/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const ol = require('common-tags').oneLine;

const oldToNewOptionNames = {
  dontCacheBustUrlsMatching: 'dontCacheBustURLsMatching',
  ignoreUrlParametersMatching: 'ignoreURLParametersMatching',
  modifyUrlPrefix: 'modifyURLPrefix',
  templatedUrls: 'templatedURLs',
};

module.exports = (options) => {
  return Object.entries(oldToNewOptionNames).map(([oldOption, newOption]) => {
    if (oldOption in options) {
      return ol`The '${oldOption}' option is deprecated and will be removed in a
      future release of Workbox. Please update your config to use '${newOption}'
      instead.`;
    }
  }).filter((item) => item);
};
