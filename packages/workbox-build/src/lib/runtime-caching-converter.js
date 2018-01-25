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

const ol = require('common-tags').oneLine;

const errors = require('./errors');

/**
 * Given a set of options that configures `sw-toolbox`'s behavior, convert it
 * into a string that would configure equivalent `workbox-sw` behavior.
 *
 * @param {Object} options See
 *        https://googlechrome.github.io/sw-toolbox/api.html#options
 * @return {string} A JSON string representing the equivalent options.
 *
 * @private
 */
function getOptionsString(options = {}) {
  let plugins = [];
  if (options.plugins) {
    plugins = options.plugins.map((plugin) => JSON.stringify(plugin));
    delete options.plugins;
  }

  // Pull cacheName and networkTimeoutSeconds from the options object, since
  // they are not directly used to construct a Plugin instance.
  // If set, need to be passed as options to the handler constructor instead.
  const {cacheName, networkTimeoutSeconds} = options;
  delete options.cacheName;
  delete options.networkTimeoutSeconds;

  const pluginsMapping = {
    backgroundSync: 'workbox.backgroundSync.Plugin',
    broadcastCacheUpdate: 'workbox.broadcastCacheUpdate.Plugin',
    expiration: 'workbox.expiration.Plugin',
    cacheableResponse: 'workbox.cacheableResponse.Plugin',
  };

  for (const [pluginName, pluginConfig] of Object.entries(options)) {
    // Ensure that we have some valid configuration to pass to Plugin().
    if (Object.keys(pluginConfig).length === 0) {
      continue;
    }

    const pluginString = pluginsMapping[pluginName];
    if (!pluginString) {
      throw new Error(`${errors['bad-runtime-caching-config']} ${pluginName}`);
    }

    plugins.push(`new ${pluginString}(${JSON.stringify(pluginConfig)})`);
  }

  if (networkTimeoutSeconds || cacheName || plugins.length > 0) {
    return ol`{
      ${networkTimeoutSeconds ? ('networkTimeoutSeconds: ' +
        JSON.stringify(networkTimeoutSeconds)) + ',' : ''}
      ${cacheName ? ('cacheName: ' + JSON.stringify(cacheName)) + ',' : ''}
      plugins: [${plugins.join(', ')}]
    }`;
  } else {
    return '';
  }
}

module.exports = (runtimeCaching = []) => {
  return runtimeCaching.map((entry) => {
    const method = entry.method || 'GET';

    if (!entry.urlPattern) {
      throw new Error(errors['urlPattern-is-required']);
    }

    if (!entry.handler) {
      throw new Error(errors['handler-is-required']);
    }

    // This validation logic is a bit too gnarly for joi, so it's manually
    // implemented here.
    if (entry.options && entry.options.networkTimeoutSeconds &&
        entry.handler !== 'networkFirst') {
      throw new Error(errors['invalid-network-timeout-seconds']);
    }

    // urlPattern might be either a string or a RegExp object.
    // If it's a string, it needs to be quoted. If it's a RegExp, it should
    // be used as-is.
    const matcher = typeof entry.urlPattern === 'string' ?
      JSON.stringify(entry.urlPattern) :
      entry.urlPattern;

    if (typeof entry.handler === 'string') {
      const optionsString = getOptionsString(entry.options || {});

      const strategyString =
        `workbox.strategies.${entry.handler}(${optionsString})`;

      return `workbox.routing.registerRoute(` +
        `${matcher}, ${strategyString}, '${method}');\n`;
    } else if (typeof entry.handler === 'function') {
      return `workbox.routing.registerRoute(` +
        `${matcher}, ${entry.handler}, '${method}');\n`;
    }
  }).filter((entry) => Boolean(entry)); // Remove undefined map() return values.
};
