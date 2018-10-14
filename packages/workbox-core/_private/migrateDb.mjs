/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.mjs';


/**
 * Handles running a series of migration functions to upgrade an IndexedDB
 * database in a `versionchange` event.
 *
 * @private
 * @param {IDBVersionChangeEvent} event
 * @param {Object<string, Function>} migrationFunctions
 */
export const migrateDb = (event, migrationFunctions) => {
  let {oldVersion, newVersion} = event;

  // Call all `migrationFunctions` values between oldVersion and newVersion.
  const migrate = (oldVersion) => {
    const next = () => {
      ++oldVersion;
      if (oldVersion <= newVersion) {
        migrate(oldVersion);
      }
    };
    const migrationFunction = migrationFunctions[`v${oldVersion}`];
    if (typeof migrationFunction === 'function') {
      migrationFunction(next);
    } else {
      next();
    }
  };
  migrate(oldVersion);
};
