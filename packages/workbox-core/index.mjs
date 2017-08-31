import assert from './internal/utils/_assert.mjs';

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

export default new WorkboxCore();
