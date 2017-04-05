const path = require('path');

const logHelper = require('../log-helper');
const constants = require('../constants');
const modifyUrlPrefixes = require('./modify-url-prefix');

module.exports = (fileDetails, options) => {
  const filteredFileDetails = fileDetails.filter((fileDetails) => {
    // Filter oversize files.
    if (fileDetails.size > constants.maximumFileSize) {
      logHelper.warn(`Skipping file '${fileDetails.file}' due to size. ` +
        `[Max size supported is ${constants.maximumFileSize}]`);
      return false;
    }

    return true;
  });

  // Convert to manifest format
  return filteredFileDetails.map((fileDetails) => {
    let url = fileDetails.file.replace(path.sep, '/');
    if (!url.startsWith('/')) {
      url = '/' + url;
    }

    // Modify URL Prefix
    if (options && options.modifyUrlPrefix) {
      url = modifyUrlPrefixes(url, options.modifyUrlPrefix);
    }

    return {
      url: url,
      revision: fileDetails.hash,
    };
  });
};
