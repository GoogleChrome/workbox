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

import {expect} from 'chai';
import sinon from 'sinon';

import {CacheExpirationPlugin} from '../../../packages/workbox-cache-expiration/CacheExpirationPlugin.mjs';

describe(`[workbox-cache-expiration] CacheExpirationPlugin`, function() {
  const sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  it(`should expose a cachedResponseWillBeUsed() method`, function() {
    const plugin = new CacheExpirationPlugin({maxAgeSeconds: 1});
    expect(plugin).to.respondTo('cachedResponseWillBeUsed');
  });

  it(`should expose a cacheDidUpdate() method`, function() {
    const plugin = new CacheExpirationPlugin({maxAgeSeconds: 1});
    expect(plugin).to.respondTo('cacheDidUpdate');
  });

  it(`should return cachedResponse when cachedResponseWillBeUsed() is called and Responses Data header it valid`, function() {
    // Just to ensure no timing flakiness in test.
    sandbox.useFakeTimers({
      toFake: ['Date'],
    });

    const dateString = new Date().toUTCString();
    const cachedResponse = new Response('', {headers: {date: dateString}});

    const plugin = new CacheExpirationPlugin({maxAgeSeconds: 1});

    const expirationManager = plugin._getCacheExpiration('test-cache');
    sandbox.spy(expirationManager, 'expireEntries');

    expect(plugin.cachedResponseWillBeUsed({cacheName: 'test-cache', cachedResponse})).to.eql(cachedResponse);
    expect(expirationManager.expireEntries.callCount).to.equal(1);
  });

  it(`should return null when cachedResponseWillBeUsed() is called and Responses Date header is too old`, function() {
    const clock = sandbox.useFakeTimers({
      toFake: ['Date'],
    });

    const dateString = new Date().toUTCString();
    const cachedResponse = new Response('', {headers: {date: dateString}});

    // Clock past the expiration of the Data header
    clock.tick(1000 + 1);

    const plugin = new CacheExpirationPlugin({maxAgeSeconds: 1});

    const expirationManager = plugin._getCacheExpiration('test-cache');
    sandbox.spy(expirationManager, 'expireEntries');

    expect(plugin.cachedResponseWillBeUsed({cacheName: 'test-cache', cachedResponse})).to.eql(null);
    expect(expirationManager.expireEntries.callCount).to.equal(1);
  });
});
