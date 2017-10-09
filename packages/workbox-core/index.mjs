import assert from './utils/assert.mjs';
import WorkboxError from './models/WorkboxError.mjs';
import LOG_LEVELS from './models/LogLevels.mjs';
import * as _private from './_private.mjs';

/**
 * This class is never expose publicly. Inidividual methods are exposed
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

    this._logLevel = (process.env.NODE_ENV === 'production') ?
      LOG_LEVELS.warn : LOG_LEVELS.verbose;
  }

  /**
   * Getter for the cache names used by Workbox.
   *
   * `cacheNames.precache` is used for precached assets and
   * `cacheNames.runtime` for everything else.
   *
   * @alias module:workbox-core.cacheNames
   * @return {Object} An object with `precache` and `runtime` cache names.
   */
  get cacheNames() {
    return {
      precache: _private.cacheNames.getPrecacheName(),
      runtime: _private.cacheNames.getRuntimeName(),
    };
  }

  /**
   * You can alter the default cache names by changing
   * the cache name details.
   *
   * Pass in an object containing any or all of the following properties,
   * `prefix`, `suffix`, `precache` and `runtime`.
   *
   * Cache names are generated as `<prefix>-<precache or runtime>-<suffix>`.
   *
   * @alias module:workbox-core.setCacheNameDetails
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

    _private.cacheNames.updateDetails(details);
  }

  /**
   * Change which messages are printed to the console by setting the this to
   * a value from [LOG_LEVELS]{@link module:workbox-core.LOG_LEVELS}.
   *
   * @alias module:workbox-core.logLevel
   * @return {number}.
   */
  get logLevel() {
    return this._logLevel;
  }

  /**
   * Getters and Setters aren't well supported by JSDOCs.
   * The getter is documented for both get/set methods.
   *
   * @param {number} newLevel the new logLevel to use.
   *
   * @private
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
}

/**
 * To use any of the Workbox service worker libraries you will need
 * to include `workbox-core` as it sets the default values for all modules
 * (like cache names) while also providing shared code across the modules.
 *
 * @module workbox-core
 */

/**
 * Utilities that are shared with other Workbox modules.
 *
 * @private
 * @alias module:workbox-core._private
 */
export {_private};

/**
 * Get an object containing the supported set of log levels.
 *
 * @returns {Object}
 *
  * @alias module:workbox-core.LOG_LEVELS
 */
export {LOG_LEVELS};

export default new WorkboxCore();
