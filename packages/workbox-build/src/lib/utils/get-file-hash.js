'use strict';

const fs = require('fs');

const getStringHash = require('./get-string-hash');
const errors = require('../errors');

module.exports = (file) => {
  try {
    const buffer = fs.readFileSync(file);
    return getStringHash(buffer);
  } catch (err) {
    throw new Error(errors['unable-to-get-file-hash'] + ` '${err.message}'`);
  }
};
