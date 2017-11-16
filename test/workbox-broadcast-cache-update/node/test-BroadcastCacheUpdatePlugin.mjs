import expectError from '../../../infra/testing/expectError';
import {devOnly} from '../../../infra/testing/env-it';

import {BroadcastCacheUpdatePlugin} from '../../../packages/workbox-broadcast-cache-update/BroadcastCacheUpdatePlugin.mjs';

describe(`[workbox-broadcast-cache-udpate] BroadcastCacheUpdate`, function() {
  describe(`cacheDidUpdate`, function() {
    devOnly.it(`should throw when called and cacheName is missing`, function() {
      return expectError(() => {
        const bcuPlugin = new BroadcastCacheUpdatePlugin('channel-name');
        const oldResponse = new Response();
        const newResponse = new Response();
        bcuPlugin.cacheDidUpdate({oldResponse, newResponse});
      }, 'incorrect-type');
    });

    devOnly.it(`should throw when called and newResponse is missing`, function() {
      return expectError(() => {
        const bcuPlugin = new BroadcastCacheUpdatePlugin('channel-name');
        const cacheName = 'cache-name';
        const oldResponse = new Response();
        bcuPlugin.cacheDidUpdate({cacheName, oldResponse});
      }, 'incorrect-class');
    });

    it(`should not throw when called with valid parameters`, function() {
      const bcuPlugin = new BroadcastCacheUpdatePlugin('channel-name');
      const cacheName = 'cache-name';
      const oldResponse = new Response();
      const newResponse = new Response();
      bcuPlugin.cacheDidUpdate({cacheName, oldResponse, newResponse});
    });
  });
});
