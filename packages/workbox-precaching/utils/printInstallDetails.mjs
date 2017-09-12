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
