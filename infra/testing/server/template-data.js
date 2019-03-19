/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

// We have to use a global variable instead of a local variable because
// at the moment we're using `clear-require` to reset all modules between
// tests, which means all local variables get reset, but globals persist.
global.__templateData = {
  ENV: process.env.NODE_ENV,
};

const get = () => {
  return Object.assign({}, global.__templateData);
};

const assign = (newData) => {
  Object.assign(global.__templateData, newData);
};

module.exports = {get, assign};
