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

import {logger} from 'workbox-core/_private/logger.mjs';
import {assert} from 'workbox-core/_private/assert.mjs';
import {CacheExpirationPlugin} from
  'workbox-cache-expiration/CacheExpirationPlugin.mjs';
import {CacheableResponsePlugin} from
  'workbox-cacheable-response/CacheableResponsePlugin.mjs';
import {BroadcastCacheUpdatePlugin} from
  'workbox-broadcast-cache-update/BroadcastCacheUpdatePlugin.mjs';
import '../_version.mjs';

const pluginBuilder = (options) => {
  const plugins = [];

  if (process.env.NODE_ENV !== 'production') {
    if (options.plugins) {
      assert.isArray(options.plugins, {
        moduleName: 'workbox-strategies',
        className: '',
        funcName: '',
        paramName: 'options.plugin',
      });
    }
  }

  const pluginParamsToClass = {
    cacheExpiration: CacheExpirationPlugin,
    cacheableResponse: CacheableResponsePlugin,
    broadcastCacheUpdate: BroadcastCacheUpdatePlugin,
  };

  for (const [pluginId, config] of Object.entries(options)) {
    // Special case for the `cacheName` config.
    if (pluginId === 'cacheName') {
      continue;
    }

    const PluginClass = pluginParamsToClass[pluginId];
    if (PluginClass) {
      plugins.push(new PluginClass(config));
    } else {
      // Nested if statement to ensure rollup can strip this statement
      if (process.env.NODE_ENV !== 'production') {
        logger.warn(`Unknown plugin config '${pluginId}' passed in to` +
          ` 'workbox.strategies'.`);
      }
    }
  }

  return plugins.concat(options.plugins || []);
};

export default pluginBuilder;
