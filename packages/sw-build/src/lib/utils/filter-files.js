const path = require('path');

const logHelper = require('../log-helper');
const constants = require('../constants');

module.exports = (fileDetails) => {
  const filteredFileDetails = fileDetails.filter((fileDetails) => {
    // Filter oversize files.
    if (fileDetails.size > constants.maximumFileSize) {
      logHelper.warn(`Skipping file '${fileDetails.file}' due to size. ` +
        `[Max size supported is ${constants.maximumFileSize}]`);
      return false;
    }

    return true;
  });

  // TODO: Strip prefix

  // Convert to manifest format
  return filteredFileDetails.map((fileDetails) => {
    let url = fileDetails.file.replace(path.sep, '/');
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    return {
      url: url,
      revision: fileDetails.hash,
    };
  });
};
