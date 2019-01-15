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
export function* generateURLVariations(url, {
  ignoreURLParametersMatching,
  directoryIndex,
  cleanURLs,
  urlManipulation,
} = {}) {
  const urlObject = new URL(url, location);
  urlObject.hash = '';
  yield urlObject.href;

  const urlWithoutIgnoredParams = removeIgnoredSearchParams(
      urlObject, ignoreURLParametersMatching);
  yield urlWithoutIgnoredParams.href;

  if (directoryIndex && urlWithoutIgnoredParams.pathname.endsWith('/')) {
    const directoryURL = new URL(urlWithoutIgnoredParams);
    directoryURL.pathname += directoryIndex;
    yield directoryURL.href;
  }

  if (cleanURLs) {
    const cleanURL = new URL(urlWithoutIgnoredParams);
    cleanURL.pathname += '.html';
    yield cleanURL.href;
  }

  if (urlManipulation) {
    const additionalURLs = urlManipulation({url: urlObject});
    for (const urlToAttempt of additionalURLs) {
      yield urlToAttempt.href;
    }
  }
}
