/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import '../_version.mjs';


/**
 * Returns true if two URLs have the same `.href` property. The URLS can be
 * relative, and if they are the current location href is used to resolve URLs.
 *
 * @private
 * @param {string} url1
 * @param {string} url2
 * @return {boolean}
 */
const urlsMatch = (url1, url2) => {
  return new URL(url1, location).href === new URL(url2, location).href;
};

export {urlsMatch};
