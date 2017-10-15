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

import assert from './utils/assert.mjs';
import WorkboxError from './models/WorkboxError.mjs';
import LOG_LEVELS from './models/LogLevels.mjs';
import {cacheNames} from './_private.mjs';
import './_version.mjs';

/**
 * This class is never exposed publicly. Inidividual methods are exposed
 * using jsdoc alias commands.
 *
 * @private
 * @memberof module:workbox-core
 */
class WorkboxCore {
  /**
   * You should not instantiate this object directly.
   *
   * @private
   */
  constructor() {
    // Only expose assert if the build is not production, allowing Rollup to
    // Remove the imports otherwise.
    if (process.env.NODE_ENV !== 'production') {
      this.assert = assert;
    }

    // Give our version strings something to hang off of.
    try {
      self.workbox.v = {};
    } catch (err) {
      // NOOP
    }

    this._logLevel = (process.env.NODE_ENV === 'production') ?
      LOG_LEVELS.warn : LOG_LEVELS.log;
  }

  /**
   * Get the current cache names used by Workbox.
   *
   * `cacheNames.precache` is used for precached assets and
   * `cacheNames.runtime` for everything else.
   *
   * @alias module:workbox-core.cacheNames
   * @return {Object} An object with `precache` and `runtime` cache names.
   */
  get cacheNames() {
    return {
      precache: cacheNames.getPrecacheName(),
      runtime: cacheNames.getRuntimeName(),
    };
  }

  /**
   * You can alter the default cache names by changing
   * the cache name details.
   *
   * Cache names are generated as `<prefix>-<precache or runtime>-<suffix>`.
   *
   * @alias module:workbox-core.setCacheNameDetails
   * @param {Object} details
   * @param {Object} details.prefix The string to add to the beginning of
   * the precache and runtime cache names.
   * @param {Object} details.suffix The string to add to the end of
   * the precache and runtime cache names.
   * @param {Object} details.precache The cache name to use for precache caching
   * (added between the prefix and suffix).
   * @param {Object} details.runtime The cache name to use for runtime caching
   * (added between the prefix and suffix).
   */
  setCacheNameDetails(details) {
    if (process.env.NODE_ENV !== 'production') {
      Object.keys(details).forEach((key) => {
        this.assert.isType(details[key], 'string', {
          moduleName: 'workbox-core',
          className: 'WorkboxCore',
          funcName: 'setCacheNameDetails',
          paramName: `details.${key}`,
        });
      });

      if ('precache' in details && details.precache.length === 0) {
        throw new WorkboxError('invalid-cache-name', {
          cacheNameId: 'precache',
          value: details.precache,
        });
      }

      if ('runtime' in details && details.runtime.length === 0) {
        throw new WorkboxError('invalid-cache-name', {
          cacheNameId: 'runtime',
          value: details.runtime,
        });
      }
    }

    cacheNames.updateDetails(details);
  }

  /**
   * Get the current log level.
   *
   * @alias module:workbox-core.logLevel
   * @return {number}.
   */
  get logLevel() {
    return this._logLevel;
  }

  /**
   * Set the current log level passing in one of the values from
   * [LOG_LEVELS]{@link module:workbox-core.LOG_LEVELS}.
   *
   * @param {number} newLevel The new log level to use.
   *
   * @alias module:workbox-core.setLogLevel
   */
  setLogLevel(newLevel) {
    if (process.env.NODE_ENV !== 'production') {
      this.assert.isType(newLevel, 'number', {
        moduleName: 'workbox-core',
        className: 'WorkboxCore',
        funcName: 'logLevel [setter]',
        paramName: `logLevel`,
      });
    }

    if (newLevel > LOG_LEVELS.silent ||
      newLevel < LOG_LEVELS.debug) {
      throw new WorkboxError('invalid-value', {
        paramName: 'logLevel',
        validValueDescription: `Please use a value from LOG_LEVELS, i.e ` +
          `'logLevel = workbox.core.LOG_LEVELS.debug'.`,
        value: newLevel,
      });
    }

    this._logLevel = newLevel;
  }
}

export default new WorkboxCore();
