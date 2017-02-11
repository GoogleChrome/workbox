const fs = require('fs');

const logHelper = require('../log-helper');
const errors = require('../errors');

module.exports = (file) => {
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile()) {
      return null;
    }
    return stat.size;
  } catch (err) {
    logHelper.error(errors['unable-to-get-file-size'], err);
    throw err;
  }
};
