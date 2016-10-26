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
import {behaviorCallbacks, defaultCacheName} from './constants';

export default class RequestWrapper {
  constructor({cacheName, behaviors, fetchOptions, matchOptions} = {}) {
    if (cacheName) {
      assert.isType({cacheName}, 'string');
      this.cacheName = cacheName;
    } else {
      this.cacheName = defaultCacheName;
    }

    if (fetchOptions) {
      assert.isType({fetchOptions}, 'object');
      this.fetchOptions = fetchOptions;
    }

    if (matchOptions) {
      assert.isType({matchOptions}, 'object');
      this.matchOptions = matchOptions;
    }

    this.callbacks = {};

    if (behaviors) {
      assert.isInstance({behaviors}, Array);

      behaviors.forEach((behavior) => {
        for (let callbackName of behaviorCallbacks) {
          if (typeof behavior[callbackName] === 'function') {
            if (!this.callbacks[callbackName]) {
              this.callbacks[callbackName] = [];
            }
            this.callbacks[callbackName].push(behavior[callbackName].bind(behavior));
          }
        }
      });
    }
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

  async fetch({request}) {
    assert.atLeastOne({request});

    return await fetch(request, this.fetchOptions).catch((error) => {
      if (this.callbacks.fetchDidFail) {
        for (let callback of this.callbacks.fetchDidFail) {
          callback(request);
        }
      }

      throw error;
    });
  }

  async fetchAndCache({request}) {
    assert.atLeastOne({request});

    const response = await this.fetch({request});
    if (response.ok || response.type === 'opaque') {
      const newResponse = response.clone();

      // Run the cache update sequence asynchronously, without blocking the
      // response from getting to the client.
      this.getCache().then(async (cache) => {
        let oldResponse;

        // Only bother getting the old response if the new response isn't opaque
        // and there's at least one cacheDidUpdateCallbacks. Otherwise, we don't
        // need it.
        if (response.type !== 'opaque' && this.callbacks.cacheDidUpdate) {
          oldResponse = await this.match({request});
        }

        // Regardless of whether or not we'll end up invoking
        // cacheDidUpdateCallbacks, wait until the cache is updated.
        await cache.put(request, newResponse);

        // If oldResponse is set, we want to trigger cacheDidUpdateCallbacks.
        if (oldResponse) {
          for (let callback of this.callbacks.cacheDidUpdate) {
            callback({cacheName: this.cacheName, oldResponse, newResponse});
          }
        }
      });
    }

    // Return a response right away, so that the client could make use of it,
    // without waiting for the cache update sequence to complete.
    return response;
  }
}
