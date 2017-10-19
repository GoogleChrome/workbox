/*
  Copyright 2017 Google Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import {_private} from 'workbox-core';
import '../_version.mjs';

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
export default (updatedEntries, notUpdatedEntries) => {
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
      `file${notUpdatedCount === 1 ? ' was' : 's were'} already cached.`;
  }
  _private.logger.groupCollapsed(printText);
  if (updatedCount > 0 && notUpdatedCount === 0) {
    // Don't nest groups, just show the precached entries.
    updatedEntries.forEach((entry) => {
      _private.logger.log(entry._originalInput);
    });
  } else {
    logGroup(
      `Number of entries cached: ${updatedCount}`,
      updatedEntries);
    logGroup(
      `Number of entries already cached: ${notUpdatedCount}`,
      notUpdatedEntries);
  }

  _private.logger.groupEnd();
};
