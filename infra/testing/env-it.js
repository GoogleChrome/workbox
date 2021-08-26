/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

module.exports = {
  devOnly: {
    it: function (title, cb) {
      // If the wrapped callback expects done, then we need to call it() with
      // a function that expects done.
      if (cb.length === 1) {
        it(title, function (done) {
          if (process.env.NODE_ENV === 'production') {
            return this.skip();
          }

          return cb(done);
        });
      } else {
        it(title, function () {
          if (process.env.NODE_ENV === 'production') {
            return this.skip();
          }

          return cb();
        });
      }
    },
  },

  prodOnly: {
    it: function (title, cb) {
      // If the wrapped callback expects done, then we need to call it() with
      // a function that expects done.
      if (cb.length === 1) {
        it(title, function (done) {
          if (process.env.NODE_ENV !== 'production') {
            return this.skip();
          }

          return cb(done);
        });
      } else {
        it(title, function () {
          if (process.env.NODE_ENV !== 'production') {
            return this.skip();
          }

          return cb();
        });
      }
    },
  },
};
