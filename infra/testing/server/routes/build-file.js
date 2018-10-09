/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const path = require('path');
const constants = require('../../../../gulp-tasks/utils/constants');
const {outputFilenameToPkgMap} = require('../../../../gulp-tasks/utils/output-filename-to-package-map');


const ROOT_DIR = path.join(__dirname, '..', '..', '..', '..');
const match = '/__WORKBOX/buildFile/:packageFile';

async function handler(req, res) {
  const {packageFile} = req.params;
  const [outputFilename, buildType, extension] = packageFile.split('.', 3);

  const pkg = outputFilenameToPkgMap[outputFilename];
  const packagePath = path.join(ROOT_DIR, 'packages', pkg.name);
  const buildPath = path.dirname(path.join(packagePath, pkg.main));

  let fileName = path.basename(pkg.main);

  if (buildType) {
    fileName = fileName.replace('.prod.', `.${buildType}.`);
  } else if (process.env.NODE_ENV === constants.BUILD_TYPES.dev) {
    fileName = fileName.replace('.prod.', '.dev.');
  }

  if (extension) {
    fileName = fileName.replace(/\.js$/, `.${extension}`);
  }

  const filePath = path.resolve(__dirname, buildPath, fileName);
  res.sendFile(filePath);
}

module.exports = {
  handler,
  match,
};
