/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

/**
 * Asynchronously waits for the passed number of milliseconds.
 *
 * @param {number} ms
 * @return {Promise}
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
