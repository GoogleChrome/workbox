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

/**
 * This is a static variable for the cache updated message type. Useful for
 * comparing to the messages `type` parameter to identify the kind of message.
 *
 * @type {string}
 *
 * @example
 * // Prints 'CACHE_UPDATED'
 * console.log(workbox.broadcastCacheUpdate.cacheUpdatedMessageType);
 *
 * @memberof module:workbox-broadcast-cache-update
 */
const cacheUpdatedMessageType = 'CACHE_UPDATED';

/**
 * The default headers to compare when determining whether two `Response`
 * objects are different.
 *
 * @private
 * @type {Array<string>}
 *
 * @memberof module:workbox-broadcast-cache-update
 */
const defaultHeadersToCheck = [
  'content-length',
  'etag',
  'last-modified',
];

/**
 * The value `'workbox-broadcast-cache-update'`, used as the `meta` field of the
 * update message.
 *
 * @private
 * @type {string}
 *
 * @memberof module:workbox-broadcast-cache-update
 */
const defaultSource = 'workbox-broadcast-cache-update';

export {
  cacheUpdatedMessageType,
  defaultHeadersToCheck,
  defaultSource,
};
