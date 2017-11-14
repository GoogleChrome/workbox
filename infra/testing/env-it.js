const constants = require('../../gulp-tasks/utils/constants');

module.exports = {
  devOnly: {
    it: function(title, cb) {
      // If the wrapped callback expects done, then we need to call it() with
      // a function that expects done.
      if (cb.length === 1) {
        it(title, function(done) {
          if (process.env.NODE_ENV !== constants.BUILD_TYPES.dev) {
            return this.skip();
          }

          return cb(done);
        });
      } else {
        it(title, function() {
          if (process.env.NODE_ENV !== constants.BUILD_TYPES.dev) {
            return this.skip();
          }

          return cb();
        });
      }
    },
  },

  prodOnly: {
    it: function(title, cb) {
      // If the wrapped callback expects done, then we need to call it() with
      // a function that expects done.
      if (cb.length === 1) {
        it(title, function(done) {
          if (process.env.NODE_ENV !== constants.BUILD_TYPES.prod) {
            return this.skip();
          }

          return cb(done);
        });
      } else {
        it(title, function() {
          if (process.env.NODE_ENV !== constants.BUILD_TYPES.prod) {
            return this.skip();
          }

          return cb();
        });
      }
    },
  },
};
