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

export default class CacheManager {
  constructor({configuration}={}) {
    this.configuration = configuration || [];
  }

  get cacheName() {
    return defaultCacheName;
  }

  get matchOptions() {
    return {};
  }

  get fetchOptions() {
    return {};
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

  async fetchAndCache({request}) {
    assert.atLeastOne({request});
    const response = await fetch(request, this.fetchOptions);

    if (response.ok || response.type === 'opaque') {
      const cache = await this.getCache();
      await cache.put(request, response.clone());
    } else {
      console.warn('Not caching error', response, 'for', event.request);
    }

    return response;
  }
};
