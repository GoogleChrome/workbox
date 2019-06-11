/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const ol = require('common-tags').oneLine;
const path = require('path');

module.exports = ({
  cacheId,
  cleanupOutdatedCaches,
  clientsClaim,
  navigateFallback,
  navigationPreload,
  offlineAnalyticsConfigString,
  runtimeCaching,
  skipWaiting,
}) => {
  const nodeModulesPath = path.posix.resolve(
      __dirname, '..', '..', 'node_modules');

  const modulesUsed = new Map();

  // precacheAndRoute is always included.
  modulesUsed.set('workbox_precaching_precacheAndRoute', {
    moduleName: 'precacheAndRoute',
    pkg: 'workbox-precaching',
  });

  if (cacheId) {
    modulesUsed.set('workbox_core_setCacheNameDetails', {
      moduleName: 'setCacheNameDetails',
      pkg: 'workbox-core',
    });
  }

  if (cleanupOutdatedCaches) {
    modulesUsed.set('workbox_precaching_cleanupOutdatedCaches', {
      moduleName: 'cleanupOutdatedCaches',
      pkg: 'workbox-precaching',
    });
  }

  if (clientsClaim) {
    modulesUsed.set('workbox_core_clientsClaim', {
      moduleName: 'clientsClaim',
      pkg: 'workbox-core',
    });
  }

  if (navigateFallback) {
    modulesUsed.set('workbox_routing_registerNavigationRoute', {
      moduleName: 'registerNavigationRoute',
      pkg: 'workbox-routing',
    });

    modulesUsed.set('workbox_precaching_getCacheKeyForURL', {
      moduleName: 'getCacheKeyForURL',
      pkg: 'workbox-precaching',
    });
  }

  if (navigationPreload) {
    modulesUsed.set('workbox_navigationPreload_enable', {
      moduleName: 'enable',
      pkg: 'workbox-navigation-preload',
    });
  }

  if (offlineAnalyticsConfigString) {
    modulesUsed.set('workbox_googleAnalytics_initialize', {
      moduleName: 'initialize',
      pkg: 'workbox-google-analytics',
    });
  }

  if (skipWaiting) {
    modulesUsed.set('workbox_core_skipWaiting', {
      moduleName: 'skipWaiting',
      pkg: 'workbox-core',
    });
  }

  if (runtimeCaching) {
    modulesUsed.set('workbox_routing_registerRoute', {
      moduleName: 'registerRoute',
      pkg: 'workbox-routing',
    });

    for (const entry of runtimeCaching) {
      if (typeof entry.handler === 'string') {
        modulesUsed.set(`workbox_strategies_${entry.handler}`, {
          moduleName: entry.handler,
          pkg: 'workbox-strategies',
        });
      }

      if (entry.options) {
        if (entry.options.backgroundSync) {
          modulesUsed.set('workbox_backgroundSync_Plugin', {
            moduleName: 'Plugin',
            pkg: 'workbox-background-sync',
          });
        }

        if (entry.options.broadcastUpdate) {
          modulesUsed.set('workbox_broadcastUpdate_Plugin', {
            moduleName: 'Plugin',
            pkg: 'workbox-broadcast',
          });
        }

        if (entry.options.expiration) {
          modulesUsed.set('workbox_expiration_Plugin', {
            moduleName: 'Plugin',
            pkg: 'workbox-expiration',
          });
        }

        if (entry.options.cacheableResponse) {
          modulesUsed.set('workbox_cacheableResponse_Plugin', {
            moduleName: 'Plugin',
            pkg: 'workbox-cacheable-response',
          });
        }
      }
    }
  }


  const workboxModuleImports = [];

  for (const [localName, {moduleName, pkg}] of modulesUsed) {
    const importStatement = ol`import {${moduleName} as ${localName}} from
      '${nodeModulesPath}/${pkg}/${moduleName}.mjs'`;

    workboxModuleImports.push(importStatement);
  }

  return workboxModuleImports;
};
