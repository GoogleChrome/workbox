const fs = require('fs');
const path = require('path');

const constants = require('../constants');
const errors = require('../errors');

module.exports = (configDetails) => {
  return new Promise((resolve, reject) => {
    const configPath = path.join(process.cwd(), constants.configName);
    fs.writeFile(configPath, JSON.stringify(configDetails), (err) => {
      if (err) {
        return reject(new Error(errors['config-write-failure'] +
          ` '${err.message}'`));
      }

      resolve();
    });
  });
};
