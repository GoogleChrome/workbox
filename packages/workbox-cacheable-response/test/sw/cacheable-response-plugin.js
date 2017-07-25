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

/* eslint-env mocha, browser */

import CacheableResponse from '../../src/lib/cacheable-response.js';
import CacheableResponsePlugin
    from '../../src/lib/cacheable-response-plugin.js';

describe(`Test of the CacheableResponsePlugin class`, function() {
  const VALID_HEADERS = {
    'x-test': 'true',
  };

  it(`should extend the CacheableResponse class`, function() {
    const plugin = new CacheableResponsePlugin({headers: VALID_HEADERS});
    expect(plugin).to.be.instanceOf(CacheableResponse);
  });

  it(`should expose a the cacheWillUpdate() method`, function() {
    const plugin = new CacheableResponsePlugin({headers: VALID_HEADERS});
    expect(plugin).to.respondTo('cacheWillUpdate');
  });
});
