'use strict';

const logHelper = require('../log-helper');

/**
 * A helper to find and log any configuration options that were set which are
 * not valid for a given usage mode.
 *
 * @param {Array<String>} blacklist The names of invalid configuration options.
 * @param {Object<String,String>} fullConfig The configuration options to check.
 * @param {String} methodName The type of build that's being attempted
 * (injectManifest, etc.).
 */
module.exports = (blacklist, fullConfig, methodName) => {
  const invalidConfigKeys = Object.keys(fullConfig)
    .filter((configKey) => blacklist.indexOf(configKey) !== -1);

  if (invalidConfigKeys.length > 0) {
    logHelper.warn(`The configuration options ` +
      `'${invalidConfigKeys.join(',')}' will be ignored in the context of ` +
      `Workbox's ${methodName} mode.`);
  }
};
