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

describe(`Test Cookies with Precache`, function() {
  it(`should cache asset with appropriate cookies with revisions asset`, function() {
    const revManager = new RevisionedCacheManager();
    // const unrevManager = new workbox.precaching.UnrevisionedCacheManager();
    revManager.addToCacheList({
      revisionedFiles: [
        `/__test/cookie/1/`,
      ],
    });
    /* unrevManager.addToCacheList({
      unrevisionedFiles: [
        `/__test/cookie/2/`,
      ],
    });*/

    return Promise.all([
      revManager.install(),
      // unrevManager.install(),
    ])
    .then(() => {
      return Promise.all([
        revManager.cleanup(),
        // unrevManager.cleanup(),
      ]);
    })
    .then(() => {
      return Promise.all([
        caches.match(`/__test/cookie/1/`),
        // caches.match(`/__test/cookie/2/`),
      ]);
    })
    .then((responses) => {
      // The /__test/cookie/ endpoint simply returns a request body
      // of all the cookies as JSON so we should be able to see the
      // swtesting cookie.
      return Promise.all(responses.map((response) => response.json()));
    })
    .then((responses) => {
      responses.forEach((response) => {
        if (!response.swtesting) {
          throw new Error(`The 'swtesting' cookie was not found.`);
        }
      });
    });
  });
});
