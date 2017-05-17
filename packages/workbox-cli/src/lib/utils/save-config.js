const fs = require('fs');
const path = require('path');
const template = require('lodash.template');

const constants = require('../constants');
const errors = require('../errors');

module.exports = (configDetails) => {
  return new Promise((resolve, reject) => {
    const configPath = path.join(process.cwd(), constants.defaultConfigName);

    // Ignore the cli config if it's in the globDirectory.
    if (configDetails.globDirectory) {
      configDetails.globIgnores = configDetails.globIgnores || [];
      configDetails.globIgnores.push(
        path.relative(configDetails.globDirectory, configPath)
      );
    }

    const templatePath = path.join(
      __dirname, '..', 'templates', 'config.js.tmpl');

    return new Promise((resolve, reject) => {
      fs.readFile(templatePath, 'utf8', (err, data) => {
        if (err) {
          return reject(
            new Error(`${errors['read-sw-template-failure']}. '${err.message}'`)
          );
        }
        resolve(data);
      });
    })
    .then((templateString) => {
      const configJSFileContents = template(templateString)({
        configDetails,
      }).trim() + '\n';

      fs.writeFile(configPath, configJSFileContents, (err) => {
        if (err) {
          return reject(new Error(errors['config-write-failure'] +
            ` '${err.message}'`));
        }

        resolve(configPath);
      });
    });
  });
};
