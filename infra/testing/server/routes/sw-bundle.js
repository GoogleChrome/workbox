/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {rollup} = require('rollup');
const replace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const multiEntry = require('rollup-plugin-multi-entry');
const commonjs = require('rollup-plugin-commonjs');


const match = '/test/:package/*/sw-bundle.js';
let cache;

async function handler(req, res) {
  const bundle = await rollup({
    input: `./test/${req.params.package}/sw/**/test-*.mjs`,
    plugins: [
      multiEntry(),
      resolve({
        customResolveOptions: {
          moduleDirectory: 'packages',
        },
      }),
      // TODO(philipwalton): some of our shared testing helpers use commonjs
      // so we have to support this for the time being.
      commonjs({
        exclude: '*.mjs',
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      }),
    ],
    cache,
  });

  // Update the cache so subsequent bundles are faster.
  cache = bundle.cache;

  const {output} = await bundle.generate({format: 'iife'});

  res.set('Content-Type', 'text/javascript');
  res.write(output[0].code);
  res.end();
}

module.exports = {
  handler,
  match,
};
