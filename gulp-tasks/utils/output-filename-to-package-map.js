/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {getPackages} = require('./get-packages');

const outputFilenameToPkgMap = {};

const windowAndSWPackages = [
  ...getPackages({type: 'sw'}),
  ...getPackages({type: 'window'}),
];

windowAndSWPackages.forEach((pkg) => {
  // When no `outputFilename` property exists, the package name is used.
  const outputFilename = pkg.workbox.outputFilename || pkg.name;

  outputFilenameToPkgMap[outputFilename] = pkg;
});

module.exports = {
  outputFilenameToPkgMap,
};
