'use strict';

const logHelper = require('../log-helper');

/**
 * A helper to find and log any configuration options that were set which are
 * not valid for a given usage mode.
 *
 * @param {Array<String>} blacklist The names of invalid configuration options.
 * @param {Object<String,String>} fullConfig The configuration options to check.
 */
module.exports = (blacklist, fullConfig) => {
  const invalidConfig = Object.keys(fullConfig)
    .filter((configKey) => blacklist.indexOf(configKey) !== -1);

  if (invalidConfig.length > 0) {
    logHelper.warn(`These Workbox configuration options are not valid for ` +
      `the current mode, and have been ignored: ${invalidConfig}`);
  }
};
