const inquirer = require('inquirer');

const logHelper = require('../log-helper');
const errors = require('../errors');

/**
 * @private
 * @return {Promise<boolean>}
 */
module.exports = () => {
  return inquirer.prompt([
    {
      name: 'saveConfig',
      message: 'Last Question - Would you like to save these settings to ' +
        'a config file?',
      type: 'confirm',
      default: true,
    },
  ])
  .then((results) => results.saveConfig)
  .catch((err) => {
    logHelper.error(
      errors['unable-to-get-save-config'],
      err
    );
    throw err;
  });
};
