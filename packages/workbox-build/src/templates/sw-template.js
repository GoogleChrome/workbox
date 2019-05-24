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

import {cleanupOutdatedCaches as workboxprecachingcleanupOutdatedCaches} from '<%= nodeModulesPath %>/workbox-precaching/cleanupOutdatedCaches.mjs';
import {clientsClaim as workboxcoreclientsClaim} from '<%= nodeModulesPath %>/workbox-core/clientsClaim.mjs';
import {enable as workboxnavigationPreloadenable} from '<%= nodeModulesPath %>/workbox-navigation-preload/enable.mjs';
import {getCacheKeyForURL as workboxprecachinggetCacheKeyForURL} from '<%= nodeModulesPath %>/workbox-precaching/getCacheKeyForURL.mjs';
import {initialize as workboxgoogleAnalyticsinitialize} from '<%= nodeModulesPath %>/workbox-google-analytics/initialize.mjs';
import {precacheAndRoute as workboxprecachingprecacheAndRoute} from '<%= nodeModulesPath %>/workbox-precaching/precacheAndRoute.mjs';
import {registerNavigationRoute as workboxroutingregisterNavigationRoute} from '<%= nodeModulesPath %>/workbox-routing/registerNavigationRoute.mjs';
import {setCacheNameDetails as workboxcoresetCacheNameDetails} from '<%= nodeModulesPath %>/workbox-core/setCacheNameDetails.mjs';
import {skipWaiting as workboxcoreskipWaiting} from '<%= nodeModulesPath %>/workbox-core/skipWaiting.mjs';

<% if (importScripts) { %>
importScripts(
  <%= importScripts.map(JSON.stringify).join(',\\n  ') %>
);
<% } %>

<% if (navigationPreload) { %>workboxnavigationPreloadenable();<% } %>

<% if (cacheId) { %>workboxcoresetCacheNameDetails({prefix: <%= JSON.stringify(cacheId) %>});<% } %>

<% if (skipWaiting) { %>
  workboxcoreskipWaiting();
<% } else { %>
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
<% } %>
<% if (clientsClaim) { %>workboxcoreclientsClaim();<% } %>

<% if (Array.isArray(manifestEntries)) {%>
/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = <%= JSON.stringify(manifestEntries, null, 2) %>.concat(self.__precacheManifest || []);
workboxprecachingprecacheAndRoute(self.__precacheManifest, <%= precacheOptionsString %>);
<% } else { %>
if (Array.isArray(self.__precacheManifest)) {
  workboxprecachingprecacheAndRoute(self.__precacheManifest, <%= precacheOptionsString %>);
}
<% } %>
<% if (cleanupOutdatedCaches) { %>workboxprecachingcleanupOutdatedCaches();<% } %>
<% if (navigateFallback) { %>workboxroutingregisterNavigationRoute(workboxprecachinggetCacheKeyForURL(<%= JSON.stringify(navigateFallback) %>)<% if (navigateFallbackWhitelist || navigateFallbackBlacklist) { %>, {
  <% if (navigateFallbackWhitelist) { %>whitelist: [<%= navigateFallbackWhitelist %>],<% } %>
  <% if (navigateFallbackBlacklist) { %>blacklist: [<%= navigateFallbackBlacklist %>],<% } %>
}<% } %>);<% } %>

<% if (runtimeCaching) { runtimeCaching.forEach(runtimeCachingString => {%><%= runtimeCachingString %><% });} %>

<% if (offlineAnalyticsConfigString) { %>workboxgoogleAnalyticsinitialize(<%= offlineAnalyticsConfigString %>);<% } %>`;
