const fs = require('fs-extra');
const path = require('path');

const pkgPathToName = require('./pkg-path-to-name');

const getDetails = (packagePath) => {
  // Read file from filesystem to avoid require caching
  const packageJsonPath = path.join(packagePath, 'package.json');
  const pkgJson = fs.readJSONSync(packageJsonPath);
  const name = pkgPathToName(packagePath).replace('workbox-', '');
  return ['workbox', name, pkgJson.version].join(':');
};

module.exports = (packagePath, buildType) => {
  const versionString =
    `try{self.workbox.v['${getDetails(packagePath)}']=1;}catch(e){} ` +
    `// eslint-disable-line`;
  return fs.writeFile(path.join(packagePath, '_version.mjs'), versionString);
};
