/*
 Copyright 2017 Google Inc. All Rights Reserved.
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

import ErrorFactory from './error-factory.js';
import logHelper from '../../../../lib/log-helper.js';
import {isType, isInstance} from '../../../../lib/assert.js';

/**
 * The public function `handleRangeRequest()` takes a `Request` and `Response`
 * object as input, and returns one of two things:
 *
 * - a new `Response` with a status of `206 Partial Content`, containing a
 * subset of the original `Response`, as determined by a valid `Range:` header
 * provided in the `Request`.
 * - a new `Response` with a status of `416 Range Not Satisfiable` if the
 * subset of the original `Response` could not be determined for any reason
 * given the inputs.
 *
 * `handleRangeRequest()` is intended to be used from standalone service worker
 * code. If you want the same functionality and are already using `workbox-sw`
 * or `workbox-runtime-caching`, then please see the examples of using the
 * `CacheRangeResponsePlugin` class, which will be easier to use.
 *
 * @example
 * self.addEventListener('fetch', (event) => {
 *   if (event.request.headers.has('range')) {
 *     event.respondWith(
 *       // You need to ensure that your resource was previously cached, e.g.
 *       // inside of an install event handler.
 *       caches.match(event.request).then((cachedResponse) => {
 *         return workbox.rangeRequests.handleRangeRequest({
 *           request: event.request,
 *           response: cachedResponse,
 *         });
 *       })
 *     );
 *   }
 * });
 *
 * @memberof module:workbox-range-requests
 */

/**
 * @private
 * @param {Object} input
 * @param {string} input.rangeHeader A Range: header value.
 * @return {Object} An object with `start` and `end` properties, reflecting
 * the parsed value of the Range: header. If either the `start` or `end` are
 * omitted, then `null` will be returned.
 */
export function parseRangeHeader({rangeHeader} = {}) {
  isType({rangeHeader}, 'string');

  const normalizedRangeHeader = rangeHeader.trim().toLowerCase();
  if (!normalizedRangeHeader.startsWith('bytes=')) {
    throw ErrorFactory.createError('unit-must-be-bytes');
  }

  // Specifying multiple ranges separate by commas is valid syntax, but this
  // library only attempts to handle a single, contiguous sequence of bytes.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range#Syntax
  if (normalizedRangeHeader.includes(',')) {
    throw ErrorFactory.createError('single-range-only');
  }

  const rangeParts = /(\d*)-(\d*)/.exec(normalizedRangeHeader);
  // We need either at least one of the start or end values.
  if (rangeParts === null || !(rangeParts[1] || rangeParts[2])) {
    throw ErrorFactory.createError('invalid-range-values');
  }

  return {
    start: rangeParts[1] === '' ? null : Number(rangeParts[1]),
    end: rangeParts[2] === '' ? null : Number(rangeParts[2]),
  };
}

/**
 * @private
 * @param {Object} input
 * @param {Blob} input.blob A source blob.
 * @param {Number|null} input.start The offset to use as the start of the
 * slice.
 * @param {Number|null} input.end The offset to use as the end of the slice.
 * @return {Object} An object with `start` and `end` properties, reflecting
 * the effective boundaries to use given the size of the blob.
 */
export function calculateEffectiveBoundaries({blob, start, end} = {}) {
  isInstance({blob}, Blob);
  const blobSize = blob.size;

  if (end > blobSize || start < 0) {
    throw ErrorFactory.createError('range-not-satisfiable');
  }

  let effectiveStart;
  let effectiveEnd;

  if (start === null) {
    effectiveStart = blobSize - end;
    effectiveEnd = blobSize;
  } else if (end === null) {
    effectiveStart = start;
    effectiveEnd = blobSize;
  } else {
    effectiveStart = start;
    // Range values are inclusive, so add 1 to the value.
    effectiveEnd = end + 1;
  }

  return {
    start: effectiveStart,
    end: effectiveEnd,
  };
}

/**
 * Given a `Request` and `Response` objects as input, this will return a
 * promise for a new `Response`.
 *
 * @param {Object} input
 * @param {Request} input.request A request, which should contain a Range:
 * header.
 * @param {Response} input.response An original response containing the full
 * content.
 * @return {Promise<Response>} Either a `206 Partial Content` response, with
 * the response body set to the slice of content specified by the request's
 * `Range:` header, or a `416 Range Not Satisfiable` response if the
 * conditions of the `Range:` header can't be met.
 */
export default async function handleRangeRequest({request, response} = {}) {
  try {
    isInstance({request}, Request);
    isInstance({response}, Response);

    const rangeHeader = request.headers.get('range');
    if (!rangeHeader) {
      throw ErrorFactory.createError('no-range-header');
    }

    const boundaries = parseRangeHeader({rangeHeader});
    const originalBlob = await response.blob();

    const effectiveBoundaries = calculateEffectiveBoundaries({
      blob: originalBlob,
      start: boundaries.start,
      end: boundaries.end,
    });

    const slicedBlob = originalBlob.slice(effectiveBoundaries.start,
      effectiveBoundaries.end);
    const slicedBlobSize = slicedBlob.size;

    const slicedResponse = new Response(slicedBlob, {
      // Status code 206 is for a Partial Content response.
      // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206
      status: 206,
      statusText: 'Partial Content',
      headers: response.headers,
    });

    slicedResponse.headers.set('Content-Length', slicedBlobSize);
    slicedResponse.headers.set('Content-Range',
      `bytes ${effectiveBoundaries.start}-${effectiveBoundaries.end - 1}/` +
      originalBlob.size);

    return slicedResponse;
  } catch (error) {
    logHelper.warn({
      message: `Unable to construct a sliced response; returning a 416 Range
        Not Satisfiable response instead.`,
      data: {request, response, error},
    });

    return new Response('', {
      status: 416,
      statusText: 'Range Not Satisfiable',
    });
  }
}
