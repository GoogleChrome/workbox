const inquirer = require('inquirer');

const logHelper = require('../log-helper');
const errors = require('../errors');

/**
 * @private
 * @return {Promise<String>}
 */
module.exports = () => {
  return inquirer.prompt([
    {
      name: 'serviceWorkerName',
      message: 'What should we name your service worker file?',
      type: 'input',
      default: 'sw.js',
    },
  ])
  .then((results) => {
    const serviceWorkerName = results.serviceWorkerName.trim();
    if (serviceWorkerName.length === 0) {
      logHelper.error(
        errors['invalid-sw-name']
      );
      throw new Error(errors['invalid-sw-name']);
    }

    return serviceWorkerName;
  })
  .catch((err) => {
    logHelper.error(
      errors['unable-to-get-sw-name'],
      err
    );
    throw err;
  });
};
