/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {rollup} = require('rollup');
const {terser} = require('rollup-plugin-terser');
const {writeFile} = require('fs-extra');
const babel = require('rollup-plugin-babel');
const loadz0r = require('rollup-plugin-loadz0r');
const path = require('path');
const replace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const tempy = require('tempy');

module.exports = async ({
  babelPresetEnvTargets,
  inlineWorkboxRuntime,
  mode,
  sourcemap,
  swDest,
  unbundledCode,
}) => {
  const temporaryFile = tempy.file({name: path.basename(swDest)});
  await writeFile(temporaryFile, unbundledCode);

  const plugins = [
    replace({'process.env.NODE_ENV': JSON.stringify(mode)}),
    resolve(),
    babel({
      presets: [['@babel/preset-env', {
        targets: {
          browsers: babelPresetEnvTargets,
        },
        loose: true,
      }]],
    }),
  ];

  if (mode === 'production') {
    plugins.push(terser({
      mangle: {
        toplevel: true,
        properties: {
          regex: /(^_|_$)/,
        },
      },
    }));
  }

  const rollupConfig = {
    plugins,
    input: temporaryFile,
  };

  // Rollup will inline the runtime by default. If we don't want that, we need
  // to add in some additional config.
  if (!inlineWorkboxRuntime) {
    rollupConfig.plugins.unshift(loadz0r());
    rollupConfig.manualChunks = (id) => {
      return id.includes('workbox') ? 'workbox' : undefined;
    };
  }

  const bundle = await rollup(rollupConfig);

  await bundle.write({
    sourcemap,
    dir: path.dirname(swDest),
    // Using an external Workbox runtime requires 'amd'.
    format: inlineWorkboxRuntime ? 'iife' : 'amd',
  });
};
