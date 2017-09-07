import assert from './utils/assert.mjs';
import * as _private from './_private.mjs';

/**
 * WorkboxCore shares code across Workbox modules.
 */
class WorkboxCore {
  /**
   * @private
   */
  constructor() {
    // Only expose assert if the build is not prod, allowing Rollup to
    // Remove the imports otherwise.
    if (process.env.NODE_ENV !== 'prod') {
      this.assert = assert;
    }
  }
}

export {_private};

export default new WorkboxCore();
