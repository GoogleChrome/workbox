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

export default async (updatedEntries, notUpdatedEntries) => {
  const updatedText =
    `${updatedEntries.length} files were updated`;
  const notUpdatedText = `${notUpdatedEntries.length} files ` +
    `were up-to-date.`;
  _private.logger.groupCollapsed(
     `During precaching, ${updatedText} and ${notUpdatedText}`);

  logGroup('Updated Entries', updatedEntries);
  logGroup('Up-to-date Entries', notUpdatedEntries);

  _private.logger.groupEnd();
};
