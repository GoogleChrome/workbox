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
import {version, defaultCacheId} from './constants';

const setOfCachedUrls = (cache) => {
  return cache.keys()
    .then((requests) => requests.map((request) => request.url))
    .then((urls) => new Set(urls));
};

const urlsToCacheKeys = (precacheConfig) => new Map(
  /** urls.map(item => {
    var relativeUrl = item[0];
    var hash = item[1];
    var absoluteUrl = new URL(relativeUrl, self.location);
    var cacheKey = createCacheKey(absoluteUrl, hashParamName, hash, /a/);
    return [absoluteUrl.toString(), cacheKey];
  })**/
);

export default ({assetsAndHahes, cacheId} = {}) => {
  assert.isType(assetsAndHahes, 'array');

  self.addEventListener('install', (event) => {
    const cacheName =
      `${cacheId || defaultCacheId}-${version}-${self.registration.scope}`;

    event.waitUntil(
      caches.open(cacheName).then((cache) => {
        return setOfCachedUrls(cache).then((cachedUrls) => {
          return Promise.all(
            Array.from(urlsToCacheKeys.values()).map(function(cacheKey) {
              // If we don't have a key matching url in the cache already,
              // add it.
              if (!cachedUrls.has(cacheKey)) {
                return cache.add(
                  new Request(cacheKey, {credentials: 'same-origin'}));
              }

              return Promise.resolve();
            })
          );
        });
      })
    );
  });
};
