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

import CacheExpirationManager from '../../../sw-cache-expiration/src/lib/cache-expiration-manager';
import {cacheName as defaultCacheName} from './defaults';

export default async ({event, options={}}) => {
  const response = await fetch(event.request);

  if (response.ok || response.type === 'opaque') {
    const cacheName = (options.cache && options.cache.cacheName) ? options.cache.cacheName : defaultCacheName;

    const cache = await caches.open(cacheName);
    await cache.put(event.request.url, response.clone());

    if (options.cache && (options.cache.maxEntries || options.cache.maxAgeSeconds)) {
      const cacheExpirationManager = new CacheExpirationManager(Object.assign({cacheName}, options.cache));
      await cacheExpirationManager.updateTimestamp(event.request.url);
      const urlsToDelete = await cacheExpirationManager.expireEntries();
      await Promise.all(urlsToDelete.map(url => cache.delete(url)));
    }
  } else {
    console.warn('Not caching error', response, 'for', event.request);
  }

  return response;
};
