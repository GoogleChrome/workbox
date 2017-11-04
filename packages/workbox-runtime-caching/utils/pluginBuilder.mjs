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

import {CacheExpirationPlugin} from
  'workbox-cache-expiration/CacheExpirationPlugin.mjs';
import '../_version.mjs';

const pluginBuilder = (options) => {
  const plugins = [];

  // TODO: Assert plugins is an array

  const pluginParamsToClass = {
    cacheExpiration: CacheExpirationPlugin,
    // TODO: Add support for 'broadcastCacheUpdate': BroadcastCacheUpdatePlugin,
    // TODO: Add support for 'cacheableResponse': CacheableResponsePlugin,
  };

  // Iterate over known plugins and add them to Request Wrapper options.
  const pluginKeys = Object.keys(pluginParamsToClass);
  pluginKeys.forEach((pluginKey) => {
    if (options[pluginKey]) {
      const PluginClass = pluginParamsToClass[pluginKey];
      const pluginConfig = options[pluginKey];
      plugins.push(new PluginClass(pluginConfig));
    }
  });

  return plugins.concat(options.plugins || []);
};

export default pluginBuilder;
