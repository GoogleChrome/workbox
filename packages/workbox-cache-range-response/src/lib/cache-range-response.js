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
import {atLeastOne, isArrayOfType, isType, isInstance} from
  '../../../../lib/assert';
import logHelper from '../../../../lib/log-helper.js';

/**
 * Use this plugin to cache responses with certain HTTP status codes or
 * header values.
 *
 * Defining both status codes and headers will cache requests with a matching
 * status code and a matching header.
 *
 * @example
 * new workbox.cacheableResponse.CacheableResponse({
 *   statuses: [0, 200, 404],
 *   headers: {
 *     'Example-Header-1': 'Header-Value-1'
 *     'Example-Header-2': 'Header-Value-2'
 *   }
 * })
 *
 * @memberof module:workbox-cache-range-response
 */
class CacheRangeResponse {
  static parseRangeHeader({rangeHeader}) {
    isType({rangeHeader}, 'string');

    const [unit, range] = rangeHeader.split(/\s+/, 2);
    if (unit !== 'bytes') {
      throw ErrorFactory.createError('unit-must-be-bytes');
    }

    if (range.inclues(',')) {
      throw ErrorFactory.createError('single-range-only');
    }

    const [start, end] = range.split(/-/, 2);

    return {
      start: parseInt(start),
      end: parseInt(end),
    };
  }
}

export default CacheRangeResponse;
