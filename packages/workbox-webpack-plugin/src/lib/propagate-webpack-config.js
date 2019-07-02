/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

module.exports = (config, compiler) => {
  // Because config is listed last, properties that are already set there take
  // precedence over derived properties from the compiler.
  return Object.assign({}, {
    mode: compiler.mode,
    sourcemap: Boolean(compiler.devtool),
  }, config);
};
