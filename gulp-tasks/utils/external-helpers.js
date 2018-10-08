/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

/* eslint-disable */
// This is extracted from the Babel runtime (original source: https://github.com/babel/babel/blob/9e0f5235b1ca5167c368a576ad7c5af62d20b0e3/packages/babel-helpers/src/helpers.js#L240).
// As part of the Rollup bundling process, it's injected once into workbox-core
// and reused throughout all of the other modules, avoiding code duplication.
// See https://github.com/GoogleChrome/workbox/pull/1048#issuecomment-344698046
// for further background.
self.babelHelpers = {
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
