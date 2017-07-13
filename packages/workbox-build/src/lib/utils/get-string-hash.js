'use strict';

const crypto = require('crypto');

module.exports = (string) => {
  const md5 = crypto.createHash('md5');
  md5.update(string);
  return md5.digest('hex');
};
