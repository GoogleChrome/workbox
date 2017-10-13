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

import '../_version.mjs';

/**
 * The available log levels in Workbox: debug, log, warn, error and silent.
 *
 * @returns {Object}
 *
 * @alias module:workbox-core.LOG_LEVELS
 */
export default {
  debug: 0,
  log: 1,
  warn: 2,
  error: 3,
  silent: 4,
};
