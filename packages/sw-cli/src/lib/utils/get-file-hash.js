const fs = require('fs');
const crypto = require('crypto');

const logHelper = require('../log-helper');
const errors = require('../errors');

module.exports = (file) => {
  try {
    const buffer = fs.readFileSync(file);
    const md5 = crypto.createHash('md5');
    md5.update(buffer);
    return md5.digest('hex');
  } catch (err) {
    logHelper.error(errors['unable-to-get-file-hash'], err);
    throw err;
  }
};
