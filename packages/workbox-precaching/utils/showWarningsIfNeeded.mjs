/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';
import '../_version.mjs';

/**
 * This method will print out a warning if a precache entry doesn't have
 * a `revision` value.
 *
 * This is common if the asset if revisioned in the url like `index.1234.css`.
 *
 * @param {Map} entriesMap
 *
 * @private
 * @memberof module:workbox-preaching
 */
export default (entriesMap) => {
  const urlOnlyEntries = [];
  entriesMap.forEach(
      (entry) => {
        if (typeof entry === 'string' || !entry._originalInput.revision) {
          urlOnlyEntries.push(entry._originalInput);
        }
      }
  );

  if (urlOnlyEntries.length === 0) {
    // No warnings needed.
    return;
  }

  logger.groupCollapsed('Are your precached assets revisioned?');

  const urlsList = urlOnlyEntries.map((urlOnlyEntry) => {
    return `    - ${JSON.stringify(urlOnlyEntry)}`;
  }).join(`\n`);

  logger.warn(
      `The following precache entries might not be revisioned:` +
    `\n\n` +
    urlsList +
    `\n\n`
  );

  logger.unprefixed.warn(`You can learn more about why this might be a ` +
    `problem here: https://developers.google.com/web/tools/workbox/modules/workbox-precaching`);

  logger.groupEnd();
};
