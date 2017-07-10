'use strict';

const fs = require('fs');

const errors = require('../errors');

module.exports = (file) => {
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile()) {
      return null;
    }
    return stat.size;
  } catch (err) {
    throw new Error(errors['unable-to-get-file-size'] + ` '${err.message}'`);
  }
};
