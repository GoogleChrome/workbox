/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const joi = require('joi');

const baseSchema = require('./base-schema');
const defaults = require('./defaults');
const regExpObject = require('./reg-exp-object');

// Add some constraints that apply to both generateSW and generateSWString.
module.exports = baseSchema.keys({
  cacheId: joi.string(),
  cleanupOutdatedCaches: joi.boolean().default(defaults.cleanupOutdatedCaches),
  clientsClaim: joi.boolean().default(defaults.clientsClaim),
  directoryIndex: joi.string(),
  ignoreURLParametersMatching: joi.array().items(regExpObject),
  navigateFallback: joi.string().default(defaults.navigateFallback),
  navigateFallbackBlacklist: joi.array().items(regExpObject),
  navigateFallbackWhitelist: joi.array().items(regExpObject),
  navigationPreload: joi.boolean().default(defaults.navigationPreload),
  offlineGoogleAnalytics: joi.alternatives().try(joi.boolean(), joi.object())
      .default(defaults.offlineGoogleAnalytics),
  runtimeCaching: joi.array().items(joi.object().keys({
    method: joi.string().valid(
        'DELETE',
        'GET',
        'HEAD',
        'PATCH',
        'POST',
        'PUT'
    ),
    urlPattern: [regExpObject, joi.string(), joi.func()],
    handler: [
      joi.func(),
      joi.string().valid(
          'CacheFirst',
          'CacheOnly',
          'NetworkFirst',
          'NetworkOnly',
          'StaleWhileRevalidate'),
    ],
    options: joi.object().keys({
      backgroundSync: joi.object().keys({
        name: joi.string().required(),
        options: joi.object(),
      }),
      broadcastUpdate: joi.object().keys({
        channelName: joi.string().required(),
        options: joi.object(),
      }),
      cacheableResponse: joi.object().keys({
        statuses: joi.array().items(joi.number().min(0).max(599)),
        headers: joi.object(),
      }).or('statuses', 'headers'),
      cacheName: joi.string(),
      expiration: joi.object().keys({
        maxEntries: joi.number().min(1),
        maxAgeSeconds: joi.number().min(1),
        purgeOnQuotaError: joi.boolean().default(defaults.purgeOnQuotaError),
      }).or('maxEntries', 'maxAgeSeconds'),
      networkTimeoutSeconds: joi.number().min(1),
      plugins: joi.array().items(joi.object()),
      fetchOptions: joi.object(),
      matchOptions: joi.object(),
    }).with('expiration', 'cacheName'),
  }).requiredKeys('urlPattern', 'handler')).when('navigationPreload', {
    is: true,
    then: joi.required(),
  }),
  skipWaiting: joi.boolean().default(defaults.skipWaiting),
}).rename('ignoreUrlParametersMatching', 'ignoreURLParametersMatching', {
  ignoreUndefined: true,
  override: true,
});
