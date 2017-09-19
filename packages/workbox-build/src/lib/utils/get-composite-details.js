'use strict';

const crypto = require('crypto');

module.exports = (compositeUrl, dependencyDetails) => {
  let totalSize = 0;
  let compositeHash = '';

  for (let fileDetails of dependencyDetails) {
    totalSize += fileDetails.size;
    compositeHash += fileDetails.hash;
  }

  const md5 = crypto.createHash('md5');
  md5.update(compositeHash);
  const hashOfHashes = md5.digest('hex');

  return {
    file: compositeUrl,
    hash: hashOfHashes,
    size: totalSize,
  };
};
