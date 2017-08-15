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

/**
 * @module workbox-range-requests
 * # workbox-range-requests
 *
 * A helper library that instructs a service worker respond to HTTP requests
 * that include a [Range:](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests)
 * header with a subset of a full response.
 *
 * If you are not already using Workbox, this library can be used in a
 * standalone form via
 * {@link handleRangeRequest|workbox.rangeRequests.handleRangeRequest}.
 *
 * If you are using Workbox for routing or request handling already, then
 * {@link CacheRangeResponsePlugin} will offer the easiest integration.
 *
 * **If your cached resources are large, use caution when adding this library.
 * Some browsers need to read the entire resource into memory before it can be
 * modified to respond to the request.**
 *
 * Inspired by
 *
 * - https://github.com/jakearchibald/range-request-test/blob/master/static/sw.js
 * - https://github.com/GoogleChrome/sample-media-pwa/blob/master/src/client/scripts/ranged-response.js
 */

import handleRangeRequest from './lib/handle-range-request.js';
import CachedRangeResponsePlugin from './lib/cached-range-response-plugin.js';

export {
  handleRangeRequest,
  CachedRangeResponsePlugin,
};
