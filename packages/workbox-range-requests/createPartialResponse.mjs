/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {WorkboxError} from 'workbox-core/_private/WorkboxError.mjs';
import {assert} from 'workbox-core/_private/assert.mjs';
import {logger} from 'workbox-core/_private/logger.mjs';

import {calculateEffectiveBoundaries} from
  './utils/calculateEffectiveBoundaries.mjs';
import {parseRangeHeader} from './utils/parseRangeHeader.mjs';

import './_version.mjs';

/**
 * Given a `Request` and `Response` objects as input, this will return a
 * promise for a new `Response`.
 *
 * @param {Request} request A request, which should contain a Range:
 * header.
 * @param {Response} originalResponse An original response containing the full
 * content.
 * @return {Promise<Response>} Either a `206 Partial Content` response, with
 * the response body set to the slice of content specified by the request's
 * `Range:` header, or a `416 Range Not Satisfiable` response if the
 * conditions of the `Range:` header can't be met.
 *
 * @memberof workbox.rangeRequests
 */
async function createPartialResponse(request, originalResponse) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      assert.isInstance(request, Request, {
        moduleName: 'workbox-range-requests',
        funcName: 'createPartialResponse',
        paramName: 'request',
      });

      assert.isInstance(originalResponse, Response, {
        moduleName: 'workbox-range-requests',
        funcName: 'createPartialResponse',
        paramName: 'originalResponse',
      });
    }

    const rangeHeader = request.headers.get('range');
    if (!rangeHeader) {
      throw new WorkboxError('no-range-header');
    }

    const boundaries = parseRangeHeader(rangeHeader);
    const originalBlob = await originalResponse.blob();

    const effectiveBoundaries = calculateEffectiveBoundaries(
        originalBlob, boundaries.start, boundaries.end);

    const slicedBlob = originalBlob.slice(effectiveBoundaries.start,
        effectiveBoundaries.end);
    const slicedBlobSize = slicedBlob.size;

    const slicedResponse = new Response(slicedBlob, {
      // Status code 206 is for a Partial Content response.
      // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206
      status: 206,
      statusText: 'Partial Content',
      headers: originalResponse.headers,
    });

    slicedResponse.headers.set('Content-Length', slicedBlobSize);
    slicedResponse.headers.set('Content-Range',
        `bytes ${effectiveBoundaries.start}-${effectiveBoundaries.end - 1}/` +
      originalBlob.size);

    return slicedResponse;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn(`Unable to construct a partial response; returning a ` +
        `416 Range Not Satisfiable response instead.`);
      logger.groupCollapsed(`View details here.`);
      logger.unprefixed.log(error);
      logger.unprefixed.log(request);
      logger.unprefixed.log(originalResponse);
      logger.groupEnd();
    }

    return new Response('', {
      status: 416,
      statusText: 'Range Not Satisfiable',
    });
  }
}

export {createPartialResponse};
