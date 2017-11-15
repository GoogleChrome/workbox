/* eslint-disable */
// This is extracted from the Babel runtime, meant to be included once in
// workbox-core and reused throughout all of the other modules as a way of
// avoiding code duplication.
// See https://github.com/babel/babel/blob/9e0f5235b1ca5167c368a576ad7c5af62d20b0e3/packages/babel-helpers/src/helpers.js#L240
var babelHelpers = {
  asyncToGenerator: function(fn) {
    return function() {
      var gen = fn.apply(this, arguments);
      return new Promise(function(resolve, reject) {
        function step(key, arg) {
          try {
            var info = gen[key](arg);
            var value = info.value;
          } catch (error) {
            reject(error);
            return;
          }

          if (info.done) {
            resolve(value);
          } else {
            return Promise.resolve(value).then(function(value) {
              step('next', value);
            }, function(err) {
              step('throw', err);
            });
          }
        }

        return step('next');
      });
    };
  },
};
