/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

export const swTemplate = `/**
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

<% if (it.importScripts) { %>
importScripts(
  <%= it.importScripts.map(JSON.stringify).join(',\\n  ') %>
);
<% } %>

<% if (it.navigationPreload) { %><%= it.use('workbox-navigation-preload', 'enable') %>();<% } %>

<% if (it.cacheId) { %><%= it.use('workbox-core', 'setCacheNameDetails') %>({prefix: <%= JSON.stringify(it.cacheId) %>});<% } %>

<% if (it.skipWaiting) { %>
self.skipWaiting();
<% } else { %>
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
<% } %>
<% if (it.clientsClaim) { %><%= it.use('workbox-core', 'clientsClaim') %>();<% } %>

<% if (Array.isArray(it.manifestEntries) && it.manifestEntries.length > 0) {%>
/**
 * The precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
<%= it.use('workbox-precaching', 'precacheAndRoute') %>(<%= JSON.stringify(it.manifestEntries, null, 2) %>, <%= it.precacheOptionsString %>);
<% if (it.cleanupOutdatedCaches) { %><%= it.use('workbox-precaching', 'cleanupOutdatedCaches') %>();<% } %>
<% if (it.navigateFallback) { %><%= it.use('workbox-routing', 'registerRoute') %>(new <%= it.use('workbox-routing', 'NavigationRoute') %>(<%= it.use('workbox-precaching', 'createHandlerBoundToURL') %>(<%= JSON.stringify(it.navigateFallback) %>)<% if (it.navigateFallbackAllowlist || it.navigateFallbackDenylist) { %>, {
  <% if (it.navigateFallbackAllowlist) { %>allowlist: [<%= it.navigateFallbackAllowlist %>],<% } %>
  <% if (it.navigateFallbackDenylist) { %>denylist: [<%= it.navigateFallbackDenylist %>],<% } %>
}<% } %>));<% } %>
<% } %>

<% if (it.runtimeCaching) { it.runtimeCaching.forEach(runtimeCachingString => {%><%= runtimeCachingString %><% });} %>

<% if (it.offlineAnalyticsConfigString) { %><%= it.use('workbox-google-analytics', 'initialize') %>(<%= it.offlineAnalyticsConfigString %>);<% } %>

<% if (it.disableDevLogs) { %>self.__WB_DISABLE_DEV_LOGS = true;<% } %>`;
