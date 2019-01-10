/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {removeIgnoredSearchParams} from './removeIgnoredSearchParams.mjs';

import '../_version.mjs';

/**
 * Generator function that yields possible variations on the original URL to
 * check, one at a time.
 *
 * @param {string} url
 * @param {Object} options
 *
 * @private
 * @memberof module:workbox-precaching
 */
export function* generateUrlVariations(url, {
  ignoreUrlParametersMatching,
  directoryIndex,
  cleanUrls,
  urlManipulation,
} = {}) {
  const urlObject = new URL(url, location);
  urlObject.hash = '';
  yield urlObject.href;

  const urlWithoutIgnoredParams = removeIgnoredSearchParams(
      urlObject, ignoreUrlParametersMatching);
  yield urlWithoutIgnoredParams.href;

  if (directoryIndex && urlWithoutIgnoredParams.pathname.endsWith('/')) {
    const directoryUrl = new URL(urlWithoutIgnoredParams);
    directoryUrl.pathname += directoryIndex;
    yield directoryUrl.href;
  }

  if (cleanUrls) {
    const cleanUrl = new URL(urlWithoutIgnoredParams);
    cleanUrl.pathname += '.html';
    yield cleanUrl.href;
  }

  if (urlManipulation) {
    const additionalUrls = urlManipulation({url: urlObject});
    for (const urlToAttempt of additionalUrls) {
      yield urlToAttempt.href;
    }
  }
}
