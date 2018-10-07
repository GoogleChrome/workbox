/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.mjs';

/**
 * The available log levels in Workbox: debug, log, warn, error and silent.
 *
 * @property {int} debug Prints all logs from Workbox. Useful for debugging.
 * @property {int} log Prints console log, warn, error and groups. Default for
 * debug builds.
 * @property {int} warn Prints console warn, error and groups. Default for
 * non-debug builds.
 * @property {int} error Print console error and groups.
 * @property {int} silent Force no logging from Workbox.
 *
 * @alias workbox.core.LOG_LEVELS
 */

export default {
  debug: 0,
  log: 1,
  warn: 2,
  error: 3,
  silent: 4,
};
