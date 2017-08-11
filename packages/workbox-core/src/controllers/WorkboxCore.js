import Assert from '../utils/Assert';
import LogHelper from '../utils/LogHelper';

/**
 * WorkboxCore shares code across Workbox modules.
 */
export default class WorkboxCore {
  /**
   * @private
   */
  constructor() {
    this._internal = {
      logHelper: new LogHelper(),
    };

    if (process.env.NODE_ENV !== 'production') {
      this._internal.assert = new Assert();
    }
  }

  /**
   * Prevent INTERNAL from being set or altered outside
   * of this class.
   * @private
   */
  get INTERNAL() {
    return this._internal;
  }
}
