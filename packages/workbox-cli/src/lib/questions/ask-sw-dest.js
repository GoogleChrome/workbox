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
      message: 'What should the path of your new service worker file be ' +
        '(i.e. \'./build/sw.js\')?',
      type: 'input',
      default: 'build/sw.js',
    },
  ])
  .then((results) => {
    const serviceWorkerName = results.serviceWorkerName.trim();
    if (serviceWorkerName.length === 0) {
      logHelper.error(
        errors['invalid-sw-dest']
      );
      throw new Error(errors['invalid-sw-dest']);
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
