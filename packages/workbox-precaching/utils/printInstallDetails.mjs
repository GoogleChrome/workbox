import {_private} from 'workbox-core';

/**
 * @param {string} groupTitle
 * @param {Array<PrecacheEntry>} entries
 *
 * @private
 */
const logGroup = (groupTitle, entries) => {
  _private.logger.groupCollapsed(groupTitle);

  entries.forEach((entry) => {
    _private.logger.log(entry._originalInput);
  });

  _private.logger.groupEnd();
};

/**
 * @param {Array<Object>} updatedEntries
 * @param {Array<Object>} notUpdatedEntries
 *
 * @private
 * @memberof module:workbox-precachig
 */
export default async (updatedEntries, notUpdatedEntries) => {
  // Goal is to print the message:
  //    Precached X files.
  // Or:
  //    Precached X files. Y files were cached and up-to-date.

  const updatedCount = updatedEntries.length;
  const notUpdatedCount = notUpdatedEntries.length;
  let printText =
    `Precached ${updatedCount} file${updatedCount === 1 ? '' : 's'}.`;
  if (notUpdatedCount > 0) {
    printText += ` ${notUpdatedCount} ` +
      `file${notUpdatedCount === 1 ? ' was' : 's were'} cached and up-to-date.`;
  }
  _private.logger.groupCollapsed(printText);
  if (updatedCount > 0 && notUpdatedCount === 0) {
    // Don't nest groups, just show the precached entries.
    updatedEntries.forEach((entry) => {
      _private.logger.log(entry._originalInput);
    });
  } else {
    logGroup(`${updatedCount} entries updated and cached`, updatedEntries);
    logGroup(`${notUpdatedCount} entried already cached and up-to-date`,
      notUpdatedEntries);
  }

  _private.logger.groupEnd();
};
