/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';
import '../_version.mjs';

const logGroup = (groupTitle, urls) => {
  logger.groupCollapsed(groupTitle);

  urls.forEach((url) => {
    logger.log(url);
  });

  logger.groupEnd();
};

/**
 * @param {Array<string>} deletedCacheRequests
 * @param {Array<string>} deletedRevisionDetails
 *
 * @private
 * @memberof module:workbox-precachig
 */
export default (deletedCacheRequests, deletedRevisionDetails) => {
  if (deletedCacheRequests.length === 0 &&
    deletedRevisionDetails.length === 0) {
    return;
  }

  const cacheDeleteCount = deletedCacheRequests.length;
  const revisionDeleteCount = deletedRevisionDetails.length;

  const cacheDeleteText =
    `${cacheDeleteCount} cached ` +
    `request${cacheDeleteCount === 1 ? ' was' : 's were'} deleted`;
  const revisionDeleteText =
    `${revisionDeleteCount} ` +
    `${revisionDeleteCount === 1 ? 'entry' : 'entries'} ` +
    `${revisionDeleteCount === 1 ? 'was' : 'were'} deleted from IndexedDB.`;

  logger.groupCollapsed(`During precaching cleanup, ${cacheDeleteText} ` +
  `and ${revisionDeleteText}`);

  logGroup('Deleted Cache Requests', deletedCacheRequests);
  logGroup('Revision Details Deleted from DB', deletedRevisionDetails);

  logger.groupEnd();
};
