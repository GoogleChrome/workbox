const fs = require('fs-extra');

const constants = require('./constants');

let uglifyNameCache;

// To enable minification of self.babelHelpers.asyncToGenerator(), which is
// referenced in multiple modules, we need to share UglifyJS's symbol name cache
// across multiple builds.
// Because each build is run in its own process, the name cache can't be shared
// in-memory, so we use these helpers to (de)serialize the data to a local file.
module.exports = {
  load: () => {
    if (fs.existsSync(constants.UGLIFY_NAME_CACHE_FILE)) {
      uglifyNameCache = fs.readJsonSync(constants.UGLIFY_NAME_CACHE_FILE);
    } else {
      uglifyNameCache = {};
    }

    return uglifyNameCache;
  },

  save: () => {
    fs.writeJsonSync(constants.UGLIFY_NAME_CACHE_FILE, uglifyNameCache);
  },
};
