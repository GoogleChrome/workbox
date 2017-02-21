const fs = require('fs');
const inquirer = require('inquirer');
const path = require('path');


const constants = require('../constants');
const logHelper = require('../log-helper');
const errors = require('../errors');

/**
 * This method requests the root directory of the web app.
 * The user can opt to type in the directory OR select = require(a list of
 * directories in the current path.
 * @return {Promise<string>} Promise that resolves with the name of the root
 * directory if given.
 */
module.exports = () => {
  const manualEntryChoice = 'Manually Enter Path';
  const currentDirectory = process.cwd();

  return new Promise((resolve, reject) => {
    fs.readdir(currentDirectory, (err, directoryContents) => {
      if (err) {
        return reject(err);
      }

      resolve(directoryContents);
    });
  })
  .then((directoryContents) => {
    return directoryContents.filter((directoryContent) => {
      return fs.statSync(directoryContent).isDirectory();
    });
  })
  .then((subdirectories) => {
    return subdirectories.filter((subdirectory) => {
      return !constants.blacklistDirectoryNames.includes(subdirectory);
    });
  })
  .then((subdirectories) => {
    const choices = subdirectories.concat([
      new inquirer.Separator(),
      manualEntryChoice,
    ]);
    return inquirer.prompt([
      {
        name: 'rootDir',
        message: 'What is the root of your web app?',
        type: 'list',
        choices: choices,
      },
      {
        name: 'rootDir',
        message: 'Please manually enter the root of your web app?',
        when: (answers) => {
          return answers.rootDir === manualEntryChoice;
        },
      },
    ]);
  })
  .then((answers) => {
    return path.join(currentDirectory, answers.rootDir);
  })
  .catch((err) => {
    logHelper.error(
      errors['unable-to-get-rootdir'],
      err
    );
    throw err;
  });
};
