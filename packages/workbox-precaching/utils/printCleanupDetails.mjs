/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';

import '../_version.mjs';

const logGroup = (groupTitle, deletedUrls) => {
  logger.groupCollapsed(groupTitle);

  for (const url of deletedUrls) {
    logger.log(url);
  }

  logger.groupEnd();
};

/**
 * @param {Array<string>} deletedUrls
 *
 * @private
 * @memberof module:workbox-precaching
 */
export function printCleanupDetails(deletedUrls) {
  const deletionCount = deletedUrls.length;
  if (deletionCount > 0) {
    logger.groupCollapsed(`During precaching cleanup, ` +
        `${deletionCount} cached ` +
        `request${deletionCount === 1 ? ' was' : 's were'} deleted.`);
    logGroup('Deleted Cache Requests', deletedUrls);
    logger.groupEnd();
  }
}
