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

import WorkboxSW from '../../src';

describe(`Cache ID`, function() {
  it(`should fail on bad cacheId parameter`, function() {
    const EXPECTED_ERROR_NAME = 'bad-cache-id';
    const badInputs = [
      true,
      [],
      {},
    ];
    badInputs.forEach((badInput, index) => {
      let thrownError = null;
      try {
        new WorkboxSW({
          cacheId: badInput,
        });
        throw new Error(`Expected error to be thrown for inputs[${index}]: '${badInput}'.`);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).to.exist;
      thrownError.name.should.equal(EXPECTED_ERROR_NAME);
    });
  });

  it(`should precache and provide runtime cache with cacheId prefix`, function() {
    const CACHE_ID = 'CACHE_ID_LOLZ';
    const workboxSW = new WorkboxSW({
      cacheId: CACHE_ID,
    });

    workboxSW._revisionedCacheManager.getCacheName().indexOf(CACHE_ID).should.not.equal(-1);
    workboxSW.runtimeCacheName.indexOf(CACHE_ID).should.not.equal(-1);
  });

  it(`should honor an explicit {excludeCacheId: true} when creating a strategy`, function() {
    const cacheId = 'CACHE_ID';

    const workboxSW = new WorkboxSW({cacheId});

    const strategy = workboxSW.strategies.cacheFirst({excludeCacheId: true});
    expect(strategy.requestWrapper.cacheName).not.to.have.string(cacheId);
  });

  // See https://github.com/GoogleChrome/workbox/issues/714
  it(`should only prepend the cacheId once when creating the internal precaching route`, function() {
    const cacheId = 'CACHE_ID';
    const expectedCachePrefix = `${cacheId}-workbox-precaching-revisioned`;

    const workboxSW = new WorkboxSW({cacheId});
    // We need to poke around a bit at the internals to get the route we care
    // about; it's not possible to spy on the method calls and check parameters,
    // since they're called during the WorkboxSW constructor and are called on
    // object instances that don't exist prior to the constructor.
    const precacheRoute = workboxSW.router._routes.get('GET')[0];
    const actualCacheName = precacheRoute.handler.requestWrapper.cacheName;

    expect(actualCacheName.startsWith(expectedCachePrefix)).to.be.true;
  });
});
