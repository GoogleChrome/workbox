/* eslint-disable */
// This is a light wrapper on top of the babel-helpers runtime code, meant to
// be included in the workbox-core bundle.
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
