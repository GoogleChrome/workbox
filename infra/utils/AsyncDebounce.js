/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

class AsyncDebounce {
  constructor(fn) {
    this._fn = fn;
    this._needsRecall = false;
  }

  call() {
    if (!this._promise) {
      /* eslint-disable no-async-promise-executor */
      this._promise = new Promise(async (resolve) => {
        do {
          this._needsRecall = false;
          await this._fn.call();
        } while (this._needsRecall !== false);

        this._promise = null;
        resolve();
      });
    } else {
      this._needsRecall = true;
    }
    return this._promise;
  }
}

module.exports = {AsyncDebounce};
