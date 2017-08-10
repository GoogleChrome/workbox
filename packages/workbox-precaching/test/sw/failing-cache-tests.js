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

importScripts('/packages/workbox-precaching/test/static/test-data.js');

describe(`Test Failing Cache Behavior`, function() {
  it(`should fail to install revisioned with 404 cache request`, function() {
    const revisionedCacheManager = new RevisionedCacheManager();
    revisionedCacheManager.addToCacheList({
      revisionedFiles: [
        '/__test/404/',
      ],
    });
    return revisionedCacheManager.install().then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      expect(err).to.exist;
      expect(err.name).to.equal('request-not-cached');
      expect(err.extras.url).to.equal(new URL('/__test/404/', self.location).toString());
    });
  });

  it.skip(`should fail to install unrevisioned with 404 cache request`, function() {
    const unrevisionedCacheManager = new workbox.precaching.UnrevisionedCacheManager();
    unrevisionedCacheManager.addToCacheList({
      unrevisionedFiles: [
        '/__test/404/',
      ],
    });
    return unrevisionedCacheManager.install().then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      expect(err).to.exist;
      expect(err.name).to.equal('request-not-cached');
      expect(err.extras.url).to.equal(new URL('/__test/404/', self.location).toString());
    });
  });

  it(`should fail to cache revisioned opaque responses by default`, function() {
    const revisionedCacheManager = new RevisionedCacheManager();
    revisionedCacheManager.addToCacheList({
      revisionedFiles: workbox.__TEST_DATA['opaque'],
    });
    return revisionedCacheManager.install().then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      expect(err).to.exist;
      expect(err.name).to.equal('request-not-cached');
      expect(err.extras.url).to.equal(new URL(workbox.__TEST_DATA['opaque'][0], self.location).toString());
    });
  });

  it.skip(`should fail to cache unrevisioned opaque responses by default`, function() {
    const unrevisionedCacheManager = new workbox.precaching.UnrevisionedCacheManager();
    unrevisionedCacheManager.addToCacheList({
      unrevisionedFiles: workbox.__TEST_DATA['opaque'],
    });
    return unrevisionedCacheManager.install().then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      expect(err).to.exist;
      expect(err.name).to.equal('request-not-cached');
      expect(err.extras.url).to.equal(new URL(workbox.__TEST_DATA['opaque'][0], self.location).toString());
    });
  });
});
