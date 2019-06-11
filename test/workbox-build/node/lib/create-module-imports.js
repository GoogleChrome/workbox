/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const proxyquire = require('proxyquire');

describe(`[workbox-build] lib/create-module-imports.js`, function() {
  const MODULE_PATH = '../../../../packages/workbox-build/src/lib/create-module-imports';
  const createModuleImports = proxyquire(MODULE_PATH, {
    path: {
      posix: {
        resolve: () => '/path/to/node_modules',
      },
    },
  });

  it(`should return the precaching import when passed an empty configuration`, function() {
    const imports = createModuleImports({});
    expect(imports).to.have.members([
      `import {precacheAndRoute as workbox_precaching_precacheAndRoute} from '/path/to/node_modules/workbox-precaching/precacheAndRoute.mjs'`,
    ]);
  });

  it(`should support the maximal configuration`, async function() {
    const imports = createModuleImports({
      cacheId: 'my-cache-id',
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      navigateFallback: true,
      navigationPreload: true,
      offlineAnalyticsConfigString: 'config-string',
      runtimeCaching: [{
        urlPattern: '/',
        handler: 'NetworkFirst',
        options: {
          backgroundSync: true,
          broadcastUpdate: true,
          expiration: true,
          cacheableResponse: true,
        },
      }, {
        urlPattern: '/',
        handler: 'NetworkOnly',
      }, {
        urlPattern: '/',
        handler: 'CacheFirst',
      }, {
        urlPattern: '/',
        handler: 'CacheOnly',
      }, {
        urlPattern: '/',
        handler: 'StaleWhileRevalidate',
      }],
      skipWaiting: true,
    });

    expect(imports).to.have.members([
      `import {precacheAndRoute as workbox_precaching_precacheAndRoute} from '/path/to/node_modules/workbox-precaching/precacheAndRoute.mjs'`,
      `import {setCacheNameDetails as workbox_core_setCacheNameDetails} from '/path/to/node_modules/workbox-core/setCacheNameDetails.mjs'`,
      `import {cleanupOutdatedCaches as workbox_precaching_cleanupOutdatedCaches} from '/path/to/node_modules/workbox-precaching/cleanupOutdatedCaches.mjs'`,
      `import {clientsClaim as workbox_core_clientsClaim} from '/path/to/node_modules/workbox-core/clientsClaim.mjs'`,
      `import {registerNavigationRoute as workbox_routing_registerNavigationRoute} from '/path/to/node_modules/workbox-routing/registerNavigationRoute.mjs'`,
      `import {getCacheKeyForURL as workbox_precaching_getCacheKeyForURL} from '/path/to/node_modules/workbox-precaching/getCacheKeyForURL.mjs'`,
      `import {enable as workbox_navigationPreload_enable} from '/path/to/node_modules/workbox-navigation-preload/enable.mjs'`,
      `import {initialize as workbox_googleAnalytics_initialize} from '/path/to/node_modules/workbox-google-analytics/initialize.mjs'`,
      `import {skipWaiting as workbox_core_skipWaiting} from '/path/to/node_modules/workbox-core/skipWaiting.mjs'`,
      `import {registerRoute as workbox_routing_registerRoute} from '/path/to/node_modules/workbox-routing/registerRoute.mjs'`,
      `import {NetworkFirst as workbox_strategies_NetworkFirst} from '/path/to/node_modules/workbox-strategies/NetworkFirst.mjs'`,
      `import {Plugin as workbox_backgroundSync_Plugin} from '/path/to/node_modules/workbox-background-sync/Plugin.mjs'`,
      `import {Plugin as workbox_broadcastUpdate_Plugin} from '/path/to/node_modules/workbox-broadcast/Plugin.mjs'`,
      `import {Plugin as workbox_expiration_Plugin} from '/path/to/node_modules/workbox-expiration/Plugin.mjs'`,
      `import {Plugin as workbox_cacheableResponse_Plugin} from '/path/to/node_modules/workbox-cacheable-response/Plugin.mjs'`,
      `import {NetworkOnly as workbox_strategies_NetworkOnly} from '/path/to/node_modules/workbox-strategies/NetworkOnly.mjs'`,
      `import {CacheFirst as workbox_strategies_CacheFirst} from '/path/to/node_modules/workbox-strategies/CacheFirst.mjs'`,
      `import {CacheOnly as workbox_strategies_CacheOnly} from '/path/to/node_modules/workbox-strategies/CacheOnly.mjs'`,
      `import {StaleWhileRevalidate as workbox_strategies_StaleWhileRevalidate} from '/path/to/node_modules/workbox-strategies/StaleWhileRevalidate.mjs'`,
    ]);
  });
});
