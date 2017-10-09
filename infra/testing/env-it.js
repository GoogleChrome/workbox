const constants = require('../../gulp-tasks/utils/constants');

module.exports = {
  devOnly: {
    it: function(title, cb) {
      it(title, function() {
        if (process.env.NODE_ENV !== constants.BUILD_TYPES.dev) {
          return this.skip();
        }

        cb();
      });
    },
  },
  prodOnly: {
    it: function(title, cb) {
      it(title, function() {
        if (process.env.NODE_ENV !== constants.BUILD_TYPES.prod) {
          return this.skip();
        }

        return cb();
      });
    },
  },
};
