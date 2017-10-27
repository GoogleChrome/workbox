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

const getFriendlyURL = (url) => {
  const urlObj = new URL(url, location);
  if (urlObj.origin === location.origin) {
    return urlObj.pathname;
  }
  return urlObj.href;
}

export default {
  cacheHit: (cacheName) => `Found a cached response in '${cacheName}'.`,
  cacheMiss: (cacheName) => `No cached response found in '${cacheName}'.`,
  makingNetworkRequest: (event) => `Making a network request for `+
    `'${getFriendlyURL(event.request.url)}'.`,
  networkRequestError: (event, err) => [`Network request for `+
    `'${getFriendlyURL(event.request.url)}' threw an error.`, err],
  networkRequestReturned: (event, response) => `Network request for `+
    `'${getFriendlyURL(event.request.url)}' returned a response with status ` +
    `'${response.status}'.`,
  networkRequestInvalid: (event) => `Unable to get a valid network request ` +
    `for '${getFriendlyURL(event.request.url)}'.`,
  // The wording may sound off, but some of the strategies (like NetworkFirst)
  // will return a 404 response from the network, attempt to put it in the cache
  // but block the caching via a plugin.
  addingToCache: (cacheName) => `Attempting to cache the response in ` +
    `'${cacheName}'.`,
};
