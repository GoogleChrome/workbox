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
import {cacheName as defaultCacheName} from './defaults';

export default class CacheWrapper {
  constructor({configuration=[]}={}) {
    assert.isInstance({configuration}, Array);

    this.cacheName = defaultCacheName;
    this.fetchOptions = {};
    this.matchOptions = {};
    this.cacheDidUpdateCallbacks = [];

    configuration.forEach(c => {
      if ('cacheName' in c) {
        this.cacheName = c.cacheName;
      }

      Object.assign(this.fetchOptions, c.fetchOptions);
      Object.assign(this.matchOptions, c.matchOptions);

      if (typeof c.cacheDidUpdate === 'function') {
        this.cacheDidUpdateCallbacks.push(c);
      }
    });
  }

  async getCache() {
    if (!this._cache) {
      this._cache = await caches.open(this.cacheName);
    }
    return this._cache;
  }

  async match({request}) {
    assert.atLeastOne({request});

    const cache = await this.getCache();
    return await cache.match(request, this.matchOptions);
  }

  async fetchAndCache({event}) {
    assert.isInstance({event}, FetchEvent);

    const response = await fetch(event.request, this.fetchOptions);
    if (response.ok || response.type === 'opaque') {
      const newResponse = response.clone();

      // Run the cache update sequence asynchronously, without blocking the
      // response from getting to the client.
      this.getCache().then(async cache => {
        let oldResponse;

        // Only bother getting the old response if the new response isn't opaque
        // and there's at least one cacheDidUpdateCallbacks. Otherwise, we don't
        // need it.
        if (response.type !== 'opaque' && this.cacheDidUpdateCallbacks.length) {
          oldResponse = await this.match({request: event.request});
        }

        // Regardless of whether or not we'll end up invoking
        // cacheDidUpdateCallbacks, wait until the cache is updated.
        await cache.put(event.request, newResponse);

        // If oldResponse is set, we want to trigger cacheDidUpdateCallbacks.
        if (oldResponse) {
          this.cacheDidUpdateCallbacks.forEach(instance => {
            instance.cacheDidUpdate({cacheName: this.cacheName, oldResponse, newResponse});
          });
        }
      });
    }

    // Return a response right away, so that the client could make use of it,
    // without waiting for the cache update sequence to complete.
    return response;
  }
};
