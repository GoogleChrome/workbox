import {_private} from 'workbox-core';

const logGroup = (groupTitle, urls) => {
  _private.logger.groupCollapsed(groupTitle);

  urls.forEach((url) => {
    _private.logger.log(url);
  });

  _private.logger.groupEnd();
};

/**
 * @param {Array<Request>} deletedCacheRequests
 * @param {Array<Object>} deletedRevisionDetails
 *
 * @private
 * @memberof module:workbox-precachig
 */
export default async (deletedCacheRequests, deletedRevisionDetails) => {
  if (deletedCacheRequests.length === 0 &&
    deletedRevisionDetails.length === 0) {
    return;
  }

  const cacheDeleteText =
    `${deletedCacheRequests.length} cached requests were deleted`;
    const revisionDeleteText = `${deletedRevisionDetails.length} revision ` +
    `details were deleted from IndexedDB.`;
  _private.logger.groupCollapsed(
     `During precaching cleanup, ${cacheDeleteText} and ${revisionDeleteText}`);

  logGroup('Deleted Cache Requests', deletedCacheRequests);
  logGroup('Revision Details Deleted from DB', deletedRevisionDetails);

  _private.logger.groupEnd();
};
