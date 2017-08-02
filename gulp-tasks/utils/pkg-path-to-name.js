const path = require('path');

const packagesPath = path.posix.join(__dirname, '..', '..', 'packages');

// A helper method than should be used when you want to log
// the package name ONLY.
module.exports = (pkgPath) => {
  return path.relative(packagesPath, pkgPath);
};
