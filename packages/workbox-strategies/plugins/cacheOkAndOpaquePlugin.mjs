/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.mjs';

export default {
  /**
   * Return return a response (i.e. allow caching) if the
   * response is ok (i.e. 200) or is opaque.
   *
   * @param {Object} options
   * @param {Response} options.response
   * @return {Response|null}
   *
   * @private
   */
  cacheWillUpdate: ({response}) => {
    if (response.ok || response.status === 0) {
      return response;
    }
    return null;
  },
};
