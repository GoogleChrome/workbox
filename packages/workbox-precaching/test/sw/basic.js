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

describe(`Test Library Surface`, function() {
  it(`should be able to get the revisioned cache manager`, function() {
    const revisionedManager = new RevisionedCacheManager();

    const cacheName = revisionedManager.getCacheName();
    if (!cacheName || typeof cacheName !== 'string' || cacheName.length === 0) {
      throw new Error('Unexpected cache name: ' + cacheName);
    }

    let cacheUrls = revisionedManager.getCachedUrls();
    if (!Array.isArray(cacheUrls) || cacheUrls.length !== 0) {
      throw new Error('Unexpected cacheUrls value: ' + JSON.stringify(cacheUrls));
    }

    const URL_1 = '/';
    const URL_2 = '/__echo/date/example.1234.txt';
    revisionedManager.addToCacheList({
      revisionedFiles: [
        {
          url: URL_1,
          revision: '1234',
        },
        URL_2,
      ],
    });

    cacheUrls = revisionedManager.getCachedUrls();
    if (!Array.isArray(cacheUrls) || cacheUrls.length !== 2) {
      throw new Error('Unexpected cacheUrls value: ' + JSON.stringify(cacheUrls));
    }

    const urlsToFind = [URL_1, URL_2];
    urlsToFind.forEach((urlToFind) => {
      if (cacheUrls.indexOf(new URL(urlToFind, location).href) === -1) {
        throw new Error(`Unable to find value '${urlToFind}' in cacheUrls: ` + JSON.stringify(cacheUrls));
      }
    });
  });

  it.skip('should be able to get the unrevisioned cache manager via workbox.precaching', function() {
    const unrevisionedManager = new workbox.precaching.UnrevisionedCacheManager();
    expect(unrevisionedManager).to.exist;

    const cacheName = unrevisionedManager.getCacheName();
    if (!cacheName || typeof cacheName !== 'string' || cacheName.length === 0) {
      throw new Error('Unexpected cache name: ' + cacheName);
    }

    let cacheUrls = unrevisionedManager.getCachedUrls();
    if (!Array.isArray(cacheUrls) || cacheUrls.length !== 0) {
      throw new Error('Unexpected cacheUrls value: ' + JSON.stringify(cacheUrls));
    }

    const URL_1 = '/';
    const URL_2 = '/__echo/date/example.1234.txt';
    unrevisionedManager.addToCacheList({
      unrevisionedFiles: [
        new Request(URL_1),
        URL_2,
      ],
    });

    cacheUrls = unrevisionedManager.getCachedUrls();
    if (!Array.isArray(cacheUrls) || cacheUrls.length !== 2) {
      throw new Error('Unexpected cacheUrls value: ' + JSON.stringify(cacheUrls));
    }

    const urlsToFind = [URL_1, URL_2];
    urlsToFind.forEach((urlToFind) => {
      if (cacheUrls.indexOf(new URL(urlToFind, location).href) === -1) {
        throw new Error(`Unable to find value '${urlToFind}' in cacheUrls: ` + JSON.stringify(cacheUrls));
      }
    });
  });
});
