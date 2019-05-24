/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {writeFile} = require('fs-extra');
const {rollup} = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const tempy = require('tempy');

module.exports = async (unbundledCode) => {
  const temporaryFile = tempy.file({extension: '.mjs'});
  await writeFile(temporaryFile, unbundledCode);

  const bundle = await rollup({
    input: temporaryFile,
    plugins: [
      resolve(),
    ],
  });

  const {output} = await bundle.generate({
    format: 'iife',
  });

  for (const chunkOrAsset of output) {
    // TODO: Fix to support multiple chunks/assets.
    return chunkOrAsset.code;
  }
};
