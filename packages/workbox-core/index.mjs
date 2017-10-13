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

import core from './workboxCore.mjs';
import * as _private from './_private.mjs';
import LOG_LEVELS from './models/LogLevels.mjs';
import './_version.mjs';

/**
 * All of the Workbox service worker libraries use workbox-core for shared
 * code as well as setting default values that need to be shared (like cache
 * names).
 *
 * @module workbox-core
 */

// A WorkboxCore instance must be exported before we can use the logger.
// This is so it can get the current log level.
if (process.env.NODE_ENV !== 'production') {
  const padding = '   ';
  _private.logger.groupCollapsed('Welcome to Workbox!');
  /* eslint-disable no-console */
  console.log(
    `📖 Read the guides and documentation\n` +
    `${padding}https://developers.google.com/web/tools/workbox/`
  );
  console.log(
    `❓ Use the [workbox] tag on StackOverflow to ask questions\n` +
    `${padding}https://stackoverflow.com/questions/ask?tags=workbox`
  );
  console.log(
    `🐛 Found a bug? Report it on GitHub\n` +
    `${padding}https://github.com/GoogleChrome/workbox/issues/new`
  );
  /* eslint-enable no-console */
  _private.logger.groupEnd();
}

/**
 * Utilities that are shared with other Workbox modules.
 *
 * @private
 * @alias module:workbox-core._private
 */
export {_private};

export {LOG_LEVELS};

export default core;
