const path = require('path');

const constants = require('../constants');
const errors = require('../errors');
const logHelper = require('../log-helper');

module.exports = (configFile) => {
  const effectiveConfigFile = configFile || constants.defaultConfigName;

  return new Promise((resolve, reject) => {
    let config = null;
    try {
      const configPath = path.isAbsolute(effectiveConfigFile) ?
        effectiveConfigFile :
        path.join(process.cwd(), effectiveConfigFile);

      config = require(configPath);
      logHelper.log(`Using configuration from ${effectiveConfigFile}.`);

      if (typeof config !== 'object' || Array.isArray(config)) {
        logHelper.warn(errors['config-not-an-object']);
        config = null;
      }
    } catch (err) {
      // If the require() failed and the developer specified a configFile,
      // treat that as a fatal error.
      // Otherwise, if the default config file was being used, ignore the error.
      if (configFile) {
        logHelper.error(errors['invalid-config-file-flag']);
        return reject(Error(errors['invalid-config-file-flag']));
      }
    }

    resolve(config);
  });
};
