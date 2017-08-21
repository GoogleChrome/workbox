import LogHelper from './internal/utils/LogHelper.mjs';

/**
 * WorkboxCore shares code across Workbox modules.
 */
class WorkboxCore {
  /**
   * @private
   */
  constructor() {
    this.INTERNAL = {
      logHelper: new LogHelper(),
    };
  }
}

export default new WorkboxCore();
