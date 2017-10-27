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

import {logger} from 'workbox-core/_private.mjs';
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
    `The following precache entries might not be revisioned:\n` +
    `\n` +
    urlsList +
    `\n\n`
  );

  logger.log(
    `'workbox-precaching' ensures assets are only downloaded when needed, ` +
    `saving user's data and speeding up the install time of new service ` +
    `workers.\n` +
    `\n` +
    `To do this, 'workbox-precaching' needs assets to by revisioned so it ` +
    `can detect when a file has changed. Without revisioning, your users ` +
    `may not get the latest files, causing problems when you a new ` +
    `service worker is deployed.\n` +
    `\n` +
    `For example, the following entries have URLs without revisioning:\n` +
    `\n` +
    `        '/styles/example.css'\n` +
    `        { url: '/index.html' }\n` +
    `\n` +
    `Compare this to URLs which are revisioned:\n` +
    `\n` +
    `        '/styles/example.1234.css'\n` +
    `        { url: '/index.1234.html' }\n` +
    `\n` +
    `If your URLs aren't revisioned, please remove them from ` +
    `precaching to make sure your users don't end up in a broken state.\n`
  );

  // TODO Add link to docs here.....
  logger.debug(`You can learn more about this issue and possible ` +
    `solutions here...`);

  logger.groupEnd();
};
