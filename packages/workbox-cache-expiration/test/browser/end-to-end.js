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

describe(`End to End Test of Cache Expiration`, function() {
  const BASE_URL = '/__echo/counter';
  const NUMBER_OF_REQUESTS = 15;
  const CACHE_NAME = 'cache-expiration';
  const EXPECTED_CACHE_SIZE = 5;

  beforeEach(function() {
    return goog.swUtils.cleanState();
  });

  async function asyncDelay(seconds) {
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  it(`should work properly when there are many simultaneous requests`, async function() {
    const iframe = await goog.swUtils.controlledBySW(
      '/packages/workbox-cache-expiration/test/static/cache-expiration.js');

    const fetchPromises = [];
    for (let i = 0; i < NUMBER_OF_REQUESTS; i++) {
      const url = `${BASE_URL}?param=${i}`;
      fetchPromises.push(iframe.contentWindow.fetch(url));
    }
    await Promise.all(fetchPromises);

    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();

    expect(keys).to.have.length(EXPECTED_CACHE_SIZE);
  });

  it(`should work properly when there are many sequential requests`, async function() {
    const iframe = await goog.swUtils.controlledBySW(
      '/packages/workbox-cache-expiration/test/static/cache-expiration.js');

    for (let i = 0; i < NUMBER_OF_REQUESTS; i++) {
      const url = `${BASE_URL}?param=${i}`;
      await iframe.contentWindow.fetch(url);
    }

    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();

    expect(keys).to.have.length(EXPECTED_CACHE_SIZE);
  });

  it(`should work properly when a cache-first strategy + maxAgeSeconds is used, and responses lack a Date header`, async function() {
    // See the comment later about a source of potential flakiness.
    this.retries(2);
    this.timeout(6 * 1000);

    const iframe = await goog.swUtils.controlledBySW(
      '/packages/workbox-cache-expiration/test/static/cache-first-max-age-seconds.js');

    const currentUrl = new URL(location);
    const nextPort = parseInt(currentUrl.port) + 1;
    const corsOrigin = `${currentUrl.protocol}//${currentUrl.hostname}:${nextPort}`;
    const testUrl = new URL('/__echo/cors-no-cache/test', corsOrigin);

    const firstResponse = await iframe.contentWindow.fetch(testUrl);
    const firstResponseBody = await firstResponse.text();

    // The service worker should be using a maxAgeSeconds of 1, so skip ahead
    // 1.5 seconds. We can't use sinon's fake clock here, since we need a
    // consistent clock between the iframe's scope and the service worker scope.
    await asyncDelay(1.5);
    const secondResponse = await iframe.contentWindow.fetch(testUrl);
    const secondResponseBody = await secondResponse.text();
    // Since we're using a cache-first policy, the expiration happens after the
    // previous entry had already been read from cache. So the first and second
    // responses should be the same.
    expect(firstResponseBody).to.eql(secondResponseBody);

    // POTENTIALLY FLAKY: Wait another 2 seconds, after which point the cache
    // expiration logic will have hopefully completed.
    await asyncDelay(2);
    const thirdResponse = await iframe.contentWindow.fetch(testUrl);
    const thirdResponseBody = await thirdResponse.text();
    // By the time the third response is read, the cache expiration will have
    // completed, so this one should be different.
    expect(firstResponseBody).not.to.eql(thirdResponseBody);
  });
});
