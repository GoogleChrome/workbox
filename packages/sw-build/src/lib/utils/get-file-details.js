const glob = require('glob');
const path = require('path');

const getFileSize = require('./get-file-size');
const getFileHash = require('./get-file-hash');
const errors = require('../errors');

module.exports = (rootDirectory, globPattern, globIgnores) => {
  let globbedFiles;
  try {
    globbedFiles = glob.sync(globPattern, {
      cwd: rootDirectory,
      ignore: globIgnores,
    });
  } catch (err) {
    throw new Error(errors['unable-to-glob-files'] + ` '${err.message}'`);
  }

  const fileDetails = globbedFiles.map((file) => {
    const fullPath = path.join(rootDirectory, file);
    const fileSize = getFileSize(fullPath);
    if (fileSize === null) {
      return null;
    }

    const fileHash = getFileHash(fullPath);
    return {
      file: `${path.relative(rootDirectory, fullPath)}`,
      hash: fileHash,
      size: fileSize,
    };
  });

  // If !== null, means it's a valid file.
  return fileDetails.filter((details) => details !== null);
};
