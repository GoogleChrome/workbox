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

import ErrorFactory from './error-factory';
import {isType, isInstance} from '../../../../lib/assert';
import logHelper from '../../../../lib/log-helper';

/**
 * Inspired by https://github.com/jakearchibald/range-request-test/blob/master/static/sw.js
 *
 * @memberof module:workbox-cache-range-response
 */
class CacheRangeResponse {
  /**
   * @param {Object} input
   * @param {string} input.rangeHeader
   * @return {Object}
   */
  static parseRangeHeader({rangeHeader} = {}) {
    isType({rangeHeader}, 'string');

    const normalizedRangeHeader = rangeHeader.trim().toLowerCase();
    if (!normalizedRangeHeader.startsWith('bytes=')) {
      throw ErrorFactory.createError('unit-must-be-bytes');
    }

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
   * @param {Object} input
   * @param {Blob} input.blob
   * @param {Number} [input.start]
   * @param {Number} [input.end]
   * @return {Blob}
   */
  static sliceBlob({blob, start, end} = {}) {
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

    return blob.slice(effectiveStart, effectiveEnd);
  }

  /**
   * @param {Object} input
   * @param {Request} input.request
   * @param {Response} input.response
   * @return {Promise<Response>}
   */
  static async sliceResponse({request, response} = {}) {
    try {
      isInstance({request}, Request);
      isInstance({response}, Response);

      const rangeHeader = request.headers.get('range');
      if (!rangeHeader) {
        throw ErrorFactory.createError('no-range-header');
      }

      const boundaries = CacheRangeResponse.parseRangeHeader({rangeHeader});
      const originalBlob = await response.blob();

      const slicedBlob = CacheRangeResponse.sliceBlob({
        blob: originalBlob,
        start: boundaries.start,
        end: boundaries.end,
      });
      const slicedBlobSize = slicedBlob.size;

      const slicedResponse = new Response(slicedBlob, {
        // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206
        status: 206,
        headers: response.headers,
      });

      slicedResponse.headers.set('Content-Length', slicedBlobSize);
      slicedResponse.headers.set('Content-Range',
        `bytes ${boundaries.start}-${boundaries.end}/${originalBlob.size}`);

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
}


export default CacheRangeResponse;
