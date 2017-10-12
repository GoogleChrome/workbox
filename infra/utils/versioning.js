const fs = require('fs-extra');
const path = require('path');

module.exports = (pkgName) => {
  // Read file from filesystem to avoid require caching
  const packageJsonPath = path.join(
    __dirname, '..', '..', 'packages', pkgName, 'package.json');
  const pkgJson = fs.readJSONSync(packageJsonPath);
  const details = ['workbox', pkgName, pkgJson.version];
  return `function v(){v._version='${details.join(':')}'};v();`;
};
