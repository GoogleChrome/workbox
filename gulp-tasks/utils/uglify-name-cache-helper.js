const fs = require('fs-extra');

const constants = require('./constants');

module.exports = {
  load: () => {
    if (fs.existsSync(constants.UGLIFY_NAME_CACHE_FILE)) {
      global.uglifyNameCache = fs.readJsonSync(
        constants.UGLIFY_NAME_CACHE_FILE);
    } else {
      global.uglifyNameCache = {};
    }
  },
  save: () => {
    fs.writeJsonSync(constants.UGLIFY_NAME_CACHE_FILE,
      global.uglifyNameCache);
  },
};
