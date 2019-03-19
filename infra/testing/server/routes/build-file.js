/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const path = require('path');
const {outputFilenameToPkgMap} = require('../../../../gulp-tasks/utils/output-filename-to-package-map');


const match = '/__WORKBOX/buildFile/:packageFile';

async function handler(req, res) {
  const {packageFile} = req.params;
  const pkg = outputFilenameToPkgMap[packageFile.split('.')[0]];
  const pkgDir = path.resolve('packages', pkg.name);


  let file;
  if (packageFile.includes('.')) {
    file = path.join(pkgDir, 'build', packageFile);
  } else {
    const pkg = outputFilenameToPkgMap[packageFile];

    // If the pkg.module references something in the build directory, use
    // that, otherwise use pkg.main.
    if (pkg.module && pkg.module.startsWith('build/')) {
      file = path.join(pkgDir, pkg.module);
    } else {
      file = path.join(pkgDir, pkg.main);
    }

    // When not specifying a dev or prod build via the filename,
    // we default to the value of NODE_ENV.
    if (process.env.NODE_ENV !== 'production') {
      file = file.replace('.prod.', '.dev.');
    }
  }

  res.sendFile(file);
}

module.exports = {
  handler,
  match,
};
