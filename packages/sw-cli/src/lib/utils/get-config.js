const fs = require('fs');
const path = require('path');

const constants = require('../constants');
const errors = require('../errors');
const logHelper = require('../log-helper');

module.exports = () => {
  return new Promise((resolve, reject) => {
    const configPath = path.join(process.cwd(), constants.configName);
    fs.readFile(configPath, (err, fileContents) => {
      if (err) {
        return resolve();
      }

      resolve(fileContents.toString());
    });
  })
  .then((configContents) => {
    if (!configContents) {
      return null;
    }

    try {
      return JSON.parse(configContents);
    } catch (err) {
      logHelper.warn(errors['config-not-json']);
      return null;
    }
  });
};
