/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {rollup} = require('rollup');
const {terser} = require('rollup-plugin-terser');
const {writeFile} = require('fs-extra');
const loadz0r = require('rollup-plugin-loadz0r');
const path = require('path');
const replace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const tempy = require('tempy');

module.exports = async ({unbundledCode, swDest}) => {
  const temporaryFile = tempy.file({name: path.basename(swDest)});
  await writeFile(temporaryFile, unbundledCode);

  const nodeEnv = process.env.NODE_ENV || 'production';
  const plugins = [
    replace({
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    }),
    resolve(),
    loadz0r(),
  ];

  // TODO: babel-preset-env support

  if (nodeEnv === 'production') {
    plugins.push(terser({
      mangle: {
        toplevel: true,
        properties: {
          regex: /(^_|_$)/,
        },
      },
    }));
  }

  const bundle = await rollup({
    plugins,
    input: temporaryFile,
    manualChunks: (id) => id.includes('workbox') ? 'workbox' : undefined,
  });

  await bundle.write({
    dir: path.dirname(swDest),
    format: 'amd',
    sourcemap: true,
  });
};
