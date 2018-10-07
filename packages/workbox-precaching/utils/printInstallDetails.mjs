/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';
import '../_version.mjs';

/**
 * @param {string} groupTitle
 * @param {Array<PrecacheEntry>} entries
 *
 * @private
 */
const _nestedGroup = (groupTitle, entries) => {
  if (entries.length === 0) {
    return;
  }

  logger.groupCollapsed(groupTitle);

  entries.forEach((entry) => {
    logger.log(entry._originalInput);
  });

  logger.groupEnd();
};

/**
 * @param {Array<Object>} entriesToPrecache
 * @param {Array<Object>} alreadyPrecachedEntries
 *
 * @private
 * @memberof module:workbox-precachig
 */
export default (entriesToPrecache, alreadyPrecachedEntries) => {
  // Goal is to print the message:
  //    Precaching X files.
  // Or:
  //    Precaching X files. Y files were cached and up-to-date.

  const precachedCount = entriesToPrecache.length;
  const alreadyPrecachedCount = alreadyPrecachedEntries.length;
  let printText =
    `Precaching ${precachedCount} file${precachedCount === 1 ? '' : 's'}.`;
  if (alreadyPrecachedCount > 0) {
    printText += ` ${alreadyPrecachedCount} ` +
      `file${alreadyPrecachedCount === 1 ? ' is' : 's are'} already cached.`;
  }

  logger.groupCollapsed(printText);

  _nestedGroup(
      `View precached URLs.`,
      entriesToPrecache);
  _nestedGroup(
      `View URLs that were already precached.`,
      alreadyPrecachedEntries);
  logger.groupEnd();
};
