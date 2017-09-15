import assert from './utils/assert.mjs';
import WorkboxError from './models/WorkboxError.mjs';
import LOG_LEVELS from './models/LogLevels.mjs';
import * as _private from './_private.mjs';

/**
 * WorkboxCore shares code across Workbox modules.
 */
class WorkboxCore {
  /**
   * @private
   */
  constructor() {
    // Only expose assert if the build is not production, allowing Rollup to
    // Remove the imports otherwise.
    if (process.env.NODE_ENV !== 'production') {
      this.assert = assert;
    }

    this._logLevel = (process.env.NODE_ENV === 'production') ?
      LOG_LEVELS.warn : LOG_LEVELS.verbose;
  }

  /**
   * This method returns the cache names used by Workbox. `cacheNames.precache`
   * is used for the precached assets and `cacheNames.runtime` for everything
   * else.
   * @return {Object} An object with `precache` and `runtime` properies.
   */
  get cacheNames() {
    return {
      precache: _private.cacheNameProvider.getPrecacheName(),
      runtime: _private.cacheNameProvider.getRuntimeName(),
    };
  }

  /**
   * You can alter the default cache names by changing
   * the cache name details.
   *
   * Pass in an object containing any of the following properties,
   * `prefix`, `suffix`, `precache` and `runtime`.
   *
   * Cache names are generated as `<prefix>-<precache or runtime>-<suffix>`.
   * @param {Object} details
   */
  setCacheNameDetails(details) {
    if (process.env.NODE_ENV !== 'production') {
      Object.keys(details).forEach((key) => {
        // TODO: Convert to Assertion
        if (typeof details[key] !== 'string') {
          throw new WorkboxError('invalid-type', {
            paramName: `details.${key}`,
            expectedType: `string`,
            value: details[key],
          });
        }
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

    _private.cacheNameProvider.updateDetails(details);
  }

  /**
   * A setter for the logLevel allowing the developer to define
   * which messages should be printed to the console.
   * @param {number} newLevel the new logLevel to use.
   */
  set logLevel(newLevel) {
    // TODO: Switch to Assertion class
    if (typeof newLevel !== 'number') {
      throw new WorkboxError('invalid-type', {
        paramName: 'logLevel',
        expectedType: 'number',
        value: newLevel,
      });
    }

    if (newLevel > LOG_LEVELS.silent ||
      newLevel < LOG_LEVELS.verbose) {
      throw new WorkboxError('invalid-value', {
        paramName: 'logLevel',
        validValueDescription: `Please use a value from LOG_LEVELS, i.e ` +
          `'logLevel = workbox.core.LOG_LEVELS.verbose'.`,
        value: newLevel,
      });
    }

    this._logLevel = newLevel;
  }

  /**
   * @return {number} The current log level.
   */
  get logLevel() {
    return this._logLevel;
  }
}

export {
  _private,
  LOG_LEVELS,
};
export default new WorkboxCore();
