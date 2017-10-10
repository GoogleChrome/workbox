/*
  Copyright 2017 Google Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

module.exports = `<% if (importScripts) { %>
importScripts(<%= importScripts.map(JSON.stringify).join(',') %>);
<% } %>
/**
 * This service worker file needs to be registered by your web application.
 * Please see https://developers.google.com/web/fundamentals/primers/service-workers/registration
 */
<% if(manifestEntries) {%>
/**
 * DO NOT EDIT __precacheManifest MANUALLY!
 *
 * The workboxSW.precache() method does the following:
 * 1. Cache URLs in the manifest to a local cache.
 * 2. When a network request is made for any of these URLs the response
 *    will ALWAYS comes from the cache, NEVER the network.
 * 3. When the service worker changes ONLY assets with a revision change are
 *    updated, old cache entries are left as is.
 *
 * By changing the file manifest manually, your users may end up not receiving
 * new versions of files because the revision hasn't changed.
 *
 * Please use workbox-build, workbox-cli, workbox-webpack-plugin, or some other
 * equivalent build tool to generate the precache manifest for you as part of
 * your pre-deployment build process.
 */
self.__precacheManifest = <%= JSON.stringify(manifestEntries, null, 2) %>.concat(self.__precacheManifest || []);
<% } %>
const workboxSW = new WorkboxSW(<%= workboxOptionsString %>);
workboxSW.precache(self.__precacheManifest);
<% if(navigateFallback) { %>workboxSW.router.registerNavigationRoute("<%= navigateFallback %>"<% if(navigateFallbackWhitelist) { %>, {
  whitelist: [<%= navigateFallbackWhitelist %>],
}<% } %>);<% } %><% if (runtimeCaching && runtimeCaching.length > 0) { runtimeCaching.forEach((runtimeCachingString) => {%><%= runtimeCachingString %>
<% }); } %>`;
