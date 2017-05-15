const path = require('path');

const constants = require('../constants');
const errors = require('../errors');
const logHelper = require('../log-helper');

module.exports = () => {
  return new Promise((resolve, reject) => {
    const configPath = path.join(process.cwd(), constants.configName);
    let config = null;
    try {
      config = require(configPath);
      if (typeof config !== 'object' || Array.isArray(config)) {
        logHelper.warn(errors['config-not-an-object']);
        config = null;
      }
    } catch (err) {
      // NOOP
    }

    resolve(config);
  });
};
