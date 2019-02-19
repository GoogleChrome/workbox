/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const path = require('path');

const packagesPath = path.join(__dirname, '..', '..', 'packages');

// A helper method that should be used when you want to log
// the package name ONLY.
module.exports = (pkgPath) => {
  return path.relative(packagesPath, pkgPath);
};
