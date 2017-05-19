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
      message: 'Where is your service worker that the manifest should be ' +
        'added to?',
      type: 'input',
      default: 'src/sw.js',
    },
  ])
  .then((results) => {
    const serviceWorkerName = results.serviceWorkerName.trim();
    if (serviceWorkerName.length === 0) {
      logHelper.error(
        errors['invalid-sw-src']
      );
      throw new Error(errors['invalid-sw-src']);
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
