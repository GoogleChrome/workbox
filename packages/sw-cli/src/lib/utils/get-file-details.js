const glob = require('glob');
const path = require('path');

const getFileSize = require('./get-file-size');
const getFileHash = require('./get-file-hash');
const logHelper = require('../log-helper');
const errors = require('../errors');

module.exports = (rootDirectory, globPattern) => {
  let globbedFiles;
  try {
    globbedFiles = glob.sync(globPattern);
  } catch (err) {
    logHelper.error(errors['unable-to-glob-files'], err);
    throw err;
  }

  const fileDetails = globbedFiles.map((file) => {
    const fileSize = getFileSize(file);
    if (fileSize === null) {
      return null;
    }

    const fileHash = getFileHash(file);
    return {
      file: `${path.relative(rootDirectory, file)}`,
      hash: fileHash,
      size: fileSize,
    };
  });

  // If !== null, means it's a valid file.
  return fileDetails.filter((details) => details !== null);
};
