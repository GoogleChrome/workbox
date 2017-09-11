import {_private} from 'workbox-core';

const logGroup = (groupTitle, entries) => {
  if (entries.length === 0) {
    return;
  }

  _private.logger.groupCollapsed(groupTitle);

  entries.forEach((entry) => {
    _private.logger.log(entry._originalInput);
  });

  _private.logger.groupEnd();
};

export default async (installDetails) => {
  let updatedText =
    `${installDetails.updatedEntries.length} files were updated`;
  let notUpdatedText = `${installDetails.notUpdatedEntries.length} files ` +
    `were up-to-date.`;
  _private.logger.groupCollapsed(
     `During precaching, ${updatedText} and ${notUpdatedText}`);

  logGroup('Updated Entries', installDetails.updatedEntries);
  logGroup('Up-to-date Entries', installDetails.notUpdatedEntries);

  _private.logger.groupEnd();
};

// TODO: Log details of number of updated / non-updated assets
      /** const updatedCacheDetails = [];
      const notUpdatedCacheDetails = [];
      allCacheDetails.forEach((cacheDetails) => {
        if (cacheDetails.wasUpdated) {
          updatedCacheDetails.push({
            url: cacheDetails.url,
            revision: cacheDetails.revision,
          });
        } else {
          notUpdatedCacheDetails.push({
            url: cacheDetails.url,
            revision: cacheDetails.revision,
          });
        }
      });

      const logData = {};
      if (updatedCacheDetails.length > 0) {
        logData['New / Updated Precache URL\'s'] =
          this._createLogFriendlyString(updatedCacheDetails);
      }

      if (notUpdatedCacheDetails.length > 0) {
        logData['Up-to-date Precache URL\'s'] =
          this._createLogFriendlyString(notUpdatedCacheDetails);
      }

      logHelper.log({
        message: `Precache Details: ${updatedCacheDetails.length} requests ` +
        `were added or updated and ` +
        `${notUpdatedCacheDetails.length} request are already ` +
        `cached and up-to-date.`,
        data: logData,
      });**/
