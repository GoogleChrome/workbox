/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const ol = require('common-tags').oneLine;

const errors = require('./errors');
const stringifyWithoutComments = require('./stringify-without-comments');

/**
 * Given a set of options that configures `sw-toolbox`'s behavior, convert it
 * into a string that would configure equivalent `workbox-sw` behavior.
 *
 * @param {Object} options See
 *        https://googlechromelabs.github.io/sw-toolbox/api.html#options
 * @return {string} A JSON string representing the equivalent options.
 *
 * @private
 */
function getOptionsString(options = {}) {
  let plugins = [];
  if (options.plugins) {
    // Using libs because JSON.stringify won't handle functions.
    plugins = options.plugins.map(stringifyWithoutComments);
    delete options.plugins;
  }

  // Pull handler-specific config from the options object, since they are
  // not directly used to construct a Plugin instance. If set, need to be
  // passed as options to the handler constructor instead.
  const handlerOptionKeys = [
    'cacheName',
    'networkTimeoutSeconds',
    'fetchOptions',
    'matchOptions',
  ];
  const handlerOptions = {};
  for (const key of handlerOptionKeys) {
    if (key in options) {
      handlerOptions[key] = options[key];
      delete options[key];
    }
  }

  const pluginsMapping = {
    backgroundSync: 'workbox.backgroundSync.Plugin',
    broadcastUpdate: 'workbox.broadcastUpdate.Plugin',
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

    let pluginCode;
    switch (pluginName) {
    // Special case logic for plugins that have a required parameter, and then
    // an additional optional config parameter.
      case 'backgroundSync': {
        const name = pluginConfig.name;
        pluginCode = `new ${pluginString}(${JSON.stringify(name)}`;
        if ('options' in pluginConfig) {
          pluginCode += `, ${stringifyWithoutComments(pluginConfig.options)}`;
        }
        pluginCode += `)`;

        break;
      }

      case 'broadcastUpdate': {
        const channelName = pluginConfig.channelName;
        const opts = Object.assign({channelName}, pluginConfig.options);
        pluginCode = `new ${pluginString}(${stringifyWithoutComments(opts)})`;

        break;
      }

      // For plugins that just pass in an Object to the constructor, like
      // expiration and cacheableResponse
      default: {
        pluginCode = `new ${pluginString}(${stringifyWithoutComments(
            pluginConfig
        )})`;
      }
    }

    plugins.push(pluginCode);
  }

  if (Object.keys(handlerOptions).length > 0 || plugins.length > 0) {
    const optionsString = JSON.stringify(handlerOptions).slice(1, -1);
    return ol`{
      ${optionsString ? optionsString + ',' : ''}
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
        entry.handler !== 'NetworkFirst') {
      throw new Error(errors['invalid-network-timeout-seconds']);
    }

    // urlPattern might be a string, a RegExp object, or a function.
    // If it's a string, it needs to be quoted.
    const matcher = typeof entry.urlPattern === 'string' ?
      JSON.stringify(entry.urlPattern) :
      entry.urlPattern;

    if (typeof entry.handler === 'string') {
      const optionsString = getOptionsString(entry.options || {});
      const strategyString =
          `new workbox.strategies.${entry.handler}(${optionsString})`;

      return `workbox.routing.registerRoute(` +
        `${matcher}, ${strategyString}, '${method}');\n`;
    } else if (typeof entry.handler === 'function') {
      return `workbox.routing.registerRoute(` +
        `${matcher}, ${entry.handler}, '${method}');\n`;
    }
  }).filter((entry) => Boolean(entry)); // Remove undefined map() return values.
};
