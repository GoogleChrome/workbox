const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

const logHelper = require('../log-helper');
const errors = require('../errors');
const constants = require('../constants');

/**
 * @private
 * @param {String} directory
 * @return {Promise<String>} Files in the directory
 */
const getFileContents = (directory) => {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, directoryContents) => {
      if (err) {
        return reject(err);
      }

      resolve(directoryContents);
    });
  })
  .then((directoryContents) => {
    const promises = directoryContents.map((directoryContent) => {
      const fullPath = path.join(directory, directoryContent);
      if (fs.statSync(fullPath).isDirectory()) {
        if (!constants.blacklistDirectoryNames.includes(directoryContent)) {
          return getFileContents(fullPath);
        } else {
          return [];
        }
      } else {
        return fullPath;
      }
    });

    return Promise.all(promises);
  })
  .then((fileResults) => {
    return fileResults.reduce((collapsedFiles, fileResult) => {
      return collapsedFiles.concat(fileResult);
    }, []);
  });
};

/**
 * @private
 * @param {Array<String>} files In directory which should indicate the
 * available extensions to offer the user.
 * @return {Promise<Array<String>>}
 */
const getFileExtensions = (files) => {
  const fileExtensions = new Set();
  files.forEach((file) => {
    const extension = path.extname(file);
    if (extension && extension.length > 0) {
      fileExtensions.add(extension);
    }
  });

  // Strip the '.' character if it's the first character.
  return [...fileExtensions].map(
    (fileExtension) => fileExtension.replace(/^\./, ''));
};

/**
 * @private
 * @param {String} globDirectory
 * @return {Promise<Array<String>>}
 */
module.exports = (globDirectory) => {
  return getFileContents(globDirectory)
  .then((files) => {
    return getFileExtensions(files);
  })
  .then((fileExtensions) => {
    if (fileExtensions.length === 0) {
      throw new Error(errors['no-file-extensions-found']);
    }

    return inquirer.prompt([
      {
        name: 'cacheExtensions',
        message: 'Which file types would you like to cache?',
        type: 'checkbox',
        choices: fileExtensions,
        default: fileExtensions,
      },
    ]);
  })
  .then((results) => {
    if (results.cacheExtensions.length === 0) {
      throw new Error(errors['no-file-extensions-selected']);
    }
    return results.cacheExtensions;
  })
  .catch((err) => {
    logHelper.error(
      errors['unable-to-get-file-extensions'],
      err
    );
    throw err;
  });
};
