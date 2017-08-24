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

import CacheExpirationPlugin from '../../src/lib/cache-expiration-plugin.js';
import CacheExpiration from '../../src/lib/cache-expiration.js';

describe(`Test of the CacheExpirationPlugin class`, function() {
  const MAX_AGE_SECONDS = 3;
  const NOW = 1487106334920;

  it(`should extend the CacheExpiration class`, function() {
    const plugin = new CacheExpirationPlugin({maxAgeSeconds: MAX_AGE_SECONDS});
    expect(plugin).to.be.instanceOf(CacheExpiration);
  });

  it(`should expose a cachedResponseWillBeUsed() method`, function() {
    const plugin = new CacheExpirationPlugin({maxAgeSeconds: MAX_AGE_SECONDS});
    expect(plugin).to.respondTo('cachedResponseWillBeUsed');
  });

  it(`should expose a cacheDidUpdate() method`, function() {
    const plugin = new CacheExpirationPlugin({maxAgeSeconds: MAX_AGE_SECONDS});
    expect(plugin).to.respondTo('cacheDidUpdate');
  });

  it(`should return cachedResponse when cachedResponseWillBeUsed() is called and isResponseFresh() is true`, function() {
    const plugin = new CacheExpirationPlugin({maxAgeSeconds: MAX_AGE_SECONDS});
    const date = new Date(NOW).toUTCString();
    const cachedResponse = new Response('', {headers: {date}});
    expect(plugin.cachedResponseWillBeUsed({cachedResponse, now: NOW})).to.eql(cachedResponse);
  });

  it(`should return null when cachedResponseWillBeUsed() is called and isResponseFresh() is false`, function() {
    const plugin = new CacheExpirationPlugin({maxAgeSeconds: MAX_AGE_SECONDS});
    // This will construct a date that is 1 second past the expiration.
    const date = new Date(NOW - ((MAX_AGE_SECONDS + 1) * 1000)).toUTCString();
    const cachedResponse = new Response('', {headers: {date}});
    expect(plugin.cachedResponseWillBeUsed({cachedResponse, now: NOW})).to.be.null;
  });
});
