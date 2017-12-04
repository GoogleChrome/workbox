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

import expectError from '../../../infra/testing/expectError';
import {devOnly} from '../../../infra/testing/env-it';

import {Plugin} from '../../../packages/workbox-cache-expiration/Plugin.mjs';
import {CacheExpiration} from '../../../packages/workbox-cache-expiration/CacheExpiration.mjs';

describe(`[workbox-cache-expiration] Plugin`, function() {
  const sandbox = sinon.sandbox.create();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  describe(`constructor`, function() {
    devOnly.it(`should throw for no config`, function() {
      return expectError(() => {
        new Plugin();
      }, 'max-entries-or-age-required');
    });

    devOnly.it(`should throw for non-number maxEntries`, function() {
      return expectError(() => {
        new Plugin({
          maxEntries: 'Hi',
        });
      }, 'incorrect-type');
    });

    devOnly.it(`should throw for non-number maxAgeSeconds`, function() {
      return expectError(() => {
        new Plugin({
          maxAgeSeconds: 'Hi',
        });
      }, 'incorrect-type');
    });

    it(`should construct with just maxAgeSeconds`, function() {
      const plugin = new Plugin({
        maxAgeSeconds: 10,
      });
      expect(plugin._maxAgeSeconds).to.equal(10);
    });

    it(`should construct with just maxEntries`, function() {
      const plugin = new Plugin({
        maxEntries: 10,
      });
      expect(plugin._config.maxEntries).to.equal(10);
    });
  });

  describe(`cachedResponseWillBeUsed()`, function() {
    it(`should expose a cachedResponseWillBeUsed() method`, function() {
      const plugin = new Plugin({maxAgeSeconds: 1});
      expect(plugin).to.respondTo('cachedResponseWillBeUsed');
    });

    it(`should return cachedResponse when cachedResponseWillBeUsed() is called and Responses Data header it valid`, function() {
      // Just to ensure no timing flakiness in test.
      sandbox.useFakeTimers({
        toFake: ['Date'],
      });

      const dateString = new Date().toUTCString();
      const cachedResponse = new Response('', {headers: {date: dateString}});

      const plugin = new Plugin({maxAgeSeconds: 1});

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

      const plugin = new Plugin({maxAgeSeconds: 1});

      const expirationManager = plugin._getCacheExpiration('test-cache');
      sandbox.spy(expirationManager, 'expireEntries');

      expect(plugin.cachedResponseWillBeUsed({cacheName: 'test-cache', cachedResponse})).to.eql(null);
      expect(expirationManager.expireEntries.callCount).to.equal(1);
    });
  });

  describe(`cachedResponseWillBeUsed()`, function() {
    it(`should expose a cacheDidUpdate() method`, function() {
      const plugin = new Plugin({maxAgeSeconds: 1});
      expect(plugin).to.respondTo('cacheDidUpdate');
    });
  });

  describe(`_isResponseDateFresh()`, function() {
    it(`should return true when maxAgeSeconds is not set`, function() {
      const plugin = new Plugin({maxEntries: 1});
      const isFresh = plugin._isResponseDateFresh(new Response('Hi'));
      expect(isFresh).to.equal(true);
    });

    it(`should return true when there is not Date header`, function() {
      const plugin = new Plugin({maxAgeSeconds: 1});
      const isFresh = plugin._isResponseDateFresh(new Response('Hi', {
        // TODO: Remove this when https://github.com/pinterest/service-workers/issues/72
        // is fixed.
        headers: {},
      }));
      expect(isFresh).to.equal(true);
    });
  });

  describe(`cacheDidUpdate()`, function() {
    it(`should update timestamps and expire entries`, async function() {
      const cacheName = 'test-cache';
      const url = new URL('/test', self.location).toString();
      const request = new Request(url);
      const plugin = new Plugin({maxAgeSeconds: 10});

      sandbox.spy(CacheExpiration.prototype, 'updateTimestamp');
      sandbox.spy(CacheExpiration.prototype, 'expireEntries');

      await plugin.cacheDidUpdate({cacheName, request});

      expect(CacheExpiration.prototype.updateTimestamp.callCount).to.equal(1);
      expect(CacheExpiration.prototype.updateTimestamp.args[0][0]).to.equal(url);
      expect(CacheExpiration.prototype.expireEntries.callCount).to.equal(1);
    });
  });
});
