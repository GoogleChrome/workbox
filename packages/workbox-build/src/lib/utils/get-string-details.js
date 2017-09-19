'use strict';

const getStringhash = require('./get-string-hash');

module.exports = (url, string) => {
  return {
    file: url,
    hash: getStringhash(string),
    size: string.length,
  };
};
