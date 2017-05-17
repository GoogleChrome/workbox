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

import ErrorFactory from './error-factory';
import logHelper from '../../../../lib/log-helper.js';

/**
 * Given two `Response's`, compares several header values to see if they are
 * the same or not.
 *
 * @example
 * const responseIsSame = responsesAreSame({
 *   first: firstResponse,
 *   second: secondResponse,
 *   headersToCheck: [
 *     'content-length',
 *     'etag',
 *     'last-modified',
 *   ]
 * });
 *
 * @private
 * @memberof module:workbox-broadcast-cache-update
 *
 * @param {Object} input
 * @param {Response} input.first One of the `Response`s.
 * @param {Response} input.second Another of the `Response`s.
 * @param {Array<string>} input.headersToCheck A list of headers that will be
 *        used to determine whether the `Response`s differ.
 * @return {boolean} Whether or not the `Response` objects are assumed to be
 *         the same.
 */
function responsesAreSame({first, second, headersToCheck}={}) {
  if (!(first instanceof Response &&
    second instanceof Response &&
    headersToCheck instanceof Array)) {
    throw ErrorFactory.createError('responses-are-same-parameters-required');
  }

  const atLeastOneHeaderAvailable = headersToCheck.some((header) => {
    return first.headers.has(header) && second.headers.has(header);
  });
  if (!atLeastOneHeaderAvailable) {
    logHelper.log({
      message: `Unable to determine whether the response has been updated
        because none of the headers that would be checked are present.`,
      data: {
        'First Response': first,
        'Second Response': second,
        'Headers To Check': JSON.stringify(headersToCheck),
      },
    });

    // Just return true, indicating the that responses are the same, since we
    // can't determine otherwise.
    return true;
  }

  return headersToCheck.every((header) => {
    return (first.headers.has(header) === second.headers.has(header)) &&
      (first.headers.get(header) === second.headers.get(header));
  });
}

export default responsesAreSame;
