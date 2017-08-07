import Assert from '../utils/Assert';
import LogHelper from '../utils/LogHelper';

/**
 * WorkboxCore shares code across Workbox modules.
 */
export default class WorkboxCore {
  /**
   * @private
   */
  get INTERNAL() {
    if (!this._internal) {
      this._internal = {
        logHelper: new LogHelper(),
      };

      if (process.env.NODE_ENV !== 'production') {
        this._internal.assert = new Assert();
      }
    }

    return this._internal;
  }
}
