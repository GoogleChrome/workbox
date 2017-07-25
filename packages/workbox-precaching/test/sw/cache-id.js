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

import RevisionedCacheManager
    from '../../src/lib/controllers/revisioned-cache-manager.js';

describe(`Test cacheId Parameter`, function() {
  let cacheManager;

  afterEach(function() {
    if (cacheManager) {
      cacheManager._close();
    }
    cacheManager = null;
  });

  it(`should throw on bad cacheId input`, function() {
    expect(() => {
      cacheManager = new RevisionedCacheManager({
        cacheId: {},
      });
    }).to.throw().with.property('name', 'bad-cache-id');
  });

  it(`should be able to generate cacheManager with cacheId`, function() {
    const CACHE_ID = 'Cache_ID_Example';
    cacheManager = new RevisionedCacheManager({
      cacheId: CACHE_ID,
    });
    cacheManager.getCacheName().indexOf(CACHE_ID).should.not.equal(-1);
  });
});
