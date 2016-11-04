/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

import assert from '../../../../lib/assert';

/**
 * Given two `Response`s, compares several header values to see if they are
 * the same or not.
 *
 * @memberof module:sw-broadcast-cache-update
 * @type {function}
 *
 * @param {Object} input
 * @param {Response} input.first One of the `Response`s.
 * @param {Response} input.second Another of the `Response`s.
 * @param {Array<string>} input.headersToCheck A list of headers that will be
 *        used to determine whether the `Response`s differ.
 * @return {boolean} Whether or not the `Response` objects are assumed to be
 *         the same.
 */
function responsesAreSame({first, second, headersToCheck}) {
  assert.isInstance({first}, Response);
  assert.isInstance({second}, Response);
  assert.isInstance({headersToCheck}, Array);

  return headersToCheck.every((header) => {
    return (first.headers.has(header) === second.headers.has(header)) &&
      (first.headers.get(header) === second.headers.get(header));
  });
}

export default responsesAreSame;
