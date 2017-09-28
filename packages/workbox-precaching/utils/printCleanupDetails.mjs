import {_private} from 'workbox-core';

const logGroup = (groupTitle, urls) => {
  _private.logger.groupCollapsed(groupTitle);

  urls.forEach((url) => {
    _private.logger.log(url);
  });

  _private.logger.groupEnd();
};

export default async (deletedCacheUrls, deletedRevisionUrls) => {
  if (deletedCacheUrls.length === 0 && deletedRevisionUrls.length === 0) {
    return;
  }

  const cacheDeleteText =
    `${deletedCacheUrls.length} cached requests were deleted`;
    const revisionDeleteText = `${deletedRevisionUrls.length} revision ` +
    `details were deleted from IndexedDB.`;
  _private.logger.groupCollapsed(
     `During precaching cleanup, ${cacheDeleteText} and ${revisionDeleteText}`);

  logGroup('Deleted Cache Requests', deletedCacheUrls);
  logGroup('Revision Details Deleted from DB', deletedRevisionUrls);

  _private.logger.groupEnd();
};
