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
      name: 'fileManifestName',
      message: 'What should we name the file manifest?',
      type: 'input',
      default: 'precache-manifest.js',
    },
  ])
  .then((results) => {
    const manifestName = results.fileManifestName.trim();
    if (manifestName.length === 0) {
      logHelper.error(
        errors['invalid-file-manifest-name']
      );
      throw new Error(errors['invalid-file-manifest-name']);
    }

    return manifestName;
  })
  .catch((err) => {
    logHelper.error(
      errors['unable-to-get-file-manifest-name'],
      err
    );
    throw err;
  });
};
