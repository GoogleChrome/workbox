/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const globby = require('globby');
const path = require('path');

module.exports = async (directory, expectedContents) => {
  const globbedFiles = await globby(directory);
  const filesWithNativeSeparator =
      globbedFiles.map((file) => file.replace(/\//g, path.sep));
  expect(filesWithNativeSeparator).to.have.members(expectedContents);
};
