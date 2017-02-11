const path = require('path');

const logHelper = require('../log-helper');
const constants = require('../constants');

module.exports = (fileDetails, excludeFiles) => {
  const filteredFileDetails = fileDetails.filter((fileDetails) => {
    // Filter oversize files.
    if (fileDetails.size > constants.maximumFileSize) {
      logHelper.warn(`Skipping file '${fileDetails.file}' due to size. ` +
        `[Max size supported is ${constants.maximumFileSize}]`);
      return false;
    }

    // Filter out excluded files (i.e. manifest and service worker)
    if (excludeFiles.indexOf(fileDetails.file) !== -1) {
      return false;
    }

    return true;
  });

  // TODO: Strip prefix

  // Convert to manifest format
  return filteredFileDetails.map((fileDetails) => {
    return {
      url: '/' + fileDetails.file.replace(path.sep, '/'),
      revision: fileDetails.hash,
    };
  });
};
