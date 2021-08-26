/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const globby = require('globby');
const upath = require('upath');

module.exports = async (directory, expectedContents) => {
  const relativeFiles = await globby('**', {cwd: directory});
  const absoluteFilesWithNativeSeparator = relativeFiles.map((file) =>
    upath.resolve(directory, file).replace(/\//g, upath.sep),
  );
  expect(absoluteFilesWithNativeSeparator).to.have.members(expectedContents);
};
