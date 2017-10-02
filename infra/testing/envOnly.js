module.exports = {
  devOnly: {
    it: function(title, cb) {
      it(title, function() {
        if (process.env.NODE_ENV === 'production') {
          this.skip();
          return;
        }

        return cb();
      });
    },
  },
  prodOnly: {
    it: function(title, cb) {
      it(title, function() {
        if (process.env.NODE_ENV !== 'production') {
          this.skip();
          return;
        }

        return cb();
      });
    },
  },
};
