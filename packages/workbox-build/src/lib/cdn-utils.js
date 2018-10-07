/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const assert = require('assert');

const cdn = require('../cdn-details.json');
const errors = require('./errors');

const getCDNOrigin = () => {
  return `${cdn.origin}/${cdn.bucketName}/${cdn.releasesDir}`;
};

const getVersionedCDNUrl = () => {
  return `${getCDNOrigin()}/${cdn.latestVersion}`;
};

const getModuleUrl = (moduleName, buildType) => {
  assert(moduleName, errors['no-module-name']);

  if (buildType) {
    const pkgJson = require(`${moduleName}/package.json`);
    if (buildType === 'dev' && pkgJson.workbox.prodOnly) {
      // This is not due to a public-facing exception, so just throw an Error(),
      // without creating an entry in errors.js.
      throw Error(`The 'dev' build of ${moduleName} is not available.`);
    }
    return `${getVersionedCDNUrl()}/${moduleName}.${buildType.slice(0, 4)}.js`;
  }
  return `${getVersionedCDNUrl()}/${moduleName}.js`;
};

module.exports = {
  getCDNOrigin,
  getModuleUrl,
};
