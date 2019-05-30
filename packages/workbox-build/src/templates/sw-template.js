/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

module.exports = `/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

import {CacheFirst as workbox_strategies_CacheFirst} from '<%= nodeModulesPath %>/workbox-strategies/CacheFirst.mjs';
import {CacheOnly as workbox_strategies_CacheOnly} from '<%= nodeModulesPath %>/workbox-strategies/CacheOnly.mjs';
import {cleanupOutdatedCaches as workbox_precaching_cleanupOutdatedCaches} from '<%= nodeModulesPath %>/workbox-precaching/cleanupOutdatedCaches.mjs';
import {clientsClaim as workbox_core_clientsClaim} from '<%= nodeModulesPath %>/workbox-core/clientsClaim.mjs';
import {enable as workbox_navigationPreload_enable} from '<%= nodeModulesPath %>/workbox-navigation-preload/enable.mjs';
import {getCacheKeyForURL as workbox_precaching_getCacheKeyForURL} from '<%= nodeModulesPath %>/workbox-precaching/getCacheKeyForURL.mjs';
import {initialize as workbox_googleAnalytics_initialize} from '<%= nodeModulesPath %>/workbox-google-analytics/initialize.mjs';
import {NetworkFirst as workbox_strategies_NetworkFirst} from '<%= nodeModulesPath %>/workbox-strategies/NetworkFirst.mjs';
import {NetworkOnly as workbox_strategies_NetworkOnly} from '<%= nodeModulesPath %>/workbox-strategies/NetworkOnly.mjs';
import {Plugin as workbox_backgroundSync_Plugin} from '<%= nodeModulesPath %>/workbox-background-sync/Plugin.mjs';
import {Plugin as workbox_broadcastUpdate_Plugin} from '<%= nodeModulesPath %>/workbox-broadcast-update/Plugin.mjs';
import {Plugin as workbox_cacheableResponse_Plugin} from '<%= nodeModulesPath %>/workbox-cacheable-response/Plugin.mjs';
import {Plugin as workbox_expiration_Plugin} from '<%= nodeModulesPath %>/workbox-expiration/Plugin.mjs';
import {precacheAndRoute as workbox_precaching_precacheAndRoute} from '<%= nodeModulesPath %>/workbox-precaching/precacheAndRoute.mjs';
import {registerNavigationRoute as workbox_routing_registerNavigationRoute} from '<%= nodeModulesPath %>/workbox-routing/registerNavigationRoute.mjs';
import {registerRoute as workbox_routing_registerRoute} from '<%= nodeModulesPath %>/workbox-routing/registerRoute.mjs';
import {setCacheNameDetails as workbox_core_setCacheNameDetails} from '<%= nodeModulesPath %>/workbox-core/setCacheNameDetails.mjs';
import {skipWaiting as workbox_core_skipWaiting} from '<%= nodeModulesPath %>/workbox-core/skipWaiting.mjs';
import {StaleWhileRevalidate as workbox_strategies_StaleWhileRevalidate} from '<%= nodeModulesPath %>/workbox-strategies/StaleWhileRevalidate.mjs';

<% if (importScripts) { %>
importScripts(
  <%= importScripts.map(JSON.stringify).join(',\\n  ') %>
);
<% } %>

<% if (navigationPreload) { %>workbox_navigationPreload_enable();<% } %>

<% if (cacheId) { %>workbox_core_setCacheNameDetails({prefix: <%= JSON.stringify(cacheId) %>});<% } %>

<% if (skipWaiting) { %>
  workbox_core_skipWaiting();
<% } else { %>
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
<% } %>
<% if (clientsClaim) { %>workbox_core_clientsClaim();<% } %>

<% if (Array.isArray(manifestEntries)) {%>
/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = <%= JSON.stringify(manifestEntries, null, 2) %>.concat(self.__precacheManifest || []);
workbox_precaching_precacheAndRoute(self.__precacheManifest, <%= precacheOptionsString %>);
<% } else { %>
if (Array.isArray(self.__precacheManifest)) {
  workbox_precaching_precacheAndRoute(self.__precacheManifest, <%= precacheOptionsString %>);
}
<% } %>
<% if (cleanupOutdatedCaches) { %>workbox_precaching_cleanupOutdatedCaches();<% } %>
<% if (navigateFallback) { %>workbox_routing_registerNavigationRoute(workbox_precaching_getCacheKeyForURL(<%= JSON.stringify(navigateFallback) %>)<% if (navigateFallbackWhitelist || navigateFallbackBlacklist) { %>, {
  <% if (navigateFallbackWhitelist) { %>whitelist: [<%= navigateFallbackWhitelist %>],<% } %>
  <% if (navigateFallbackBlacklist) { %>blacklist: [<%= navigateFallbackBlacklist %>],<% } %>
}<% } %>);<% } %>

<% if (runtimeCaching) { runtimeCaching.forEach(runtimeCachingString => {%><%= runtimeCachingString %><% });} %>

<% if (offlineAnalyticsConfigString) { %>workbox_googleAnalytics_initialize(<%= offlineAnalyticsConfigString %>);<% } %>`;
