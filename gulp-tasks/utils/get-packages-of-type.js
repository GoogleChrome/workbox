/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const glob = require('glob');
const path = require('path');

module.exports = (root, type) => {
  const pathToPkgJsons = glob.sync('packages/*/package.json', {cwd: root});
  return pathToPkgJsons.filter((pathToPkgJson) => {
    const pkg = require(`${path.resolve(root)}/${pathToPkgJson}`);
    return pkg.workbox && (pkg.workbox.packageType === type);
  }).map((pathToPkgJson) => {
    // Since we matched the glob pattern then we know that this will always
    // return the name of the package.
    return pathToPkgJson.split('/')[1];
  });
};
