/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const glob = require('glob');
const path = require('path');

const DEFAULT_ROOT = path.join(__dirname, '..', '..');

const getPackages = ({type, root = DEFAULT_ROOT} = {}) => {
  const pathToPkgJsons = glob.sync('packages/*/package.json', {cwd: root});

  return pathToPkgJsons
    .map((pathToPkgJson) => {
      const pkg = require(`${path.resolve(root)}/${pathToPkgJson}`);
      return pkg;
    })
    .filter((pkg) => {
      return pkg.workbox && pkg.workbox.packageType === type;
    });
};

module.exports = {
  getPackages,
};
