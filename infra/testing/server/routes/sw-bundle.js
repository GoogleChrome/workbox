/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {getPackages} = require('../../../../gulp-tasks/utils/get-packages');
const {needsTranspile, queueTranspile} =
  require('../../../../gulp-tasks/transpile-typescript').functions;
const {nodeResolve} = require('@rollup/plugin-node-resolve');
const {rollup} = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');
const multiEntry = require('@rollup/plugin-multi-entry');
const replace = require('@rollup/plugin-replace');

const SW_NAMESPACES = getPackages({type: 'sw'}).map((pkg) => {
  return pkg.workbox.browserNamespace;
});

const match = '/test/:package/*/sw-bundle.js';
const caches = {};

async function handler(req, res) {
  const env = process.env.NODE_ENV || 'development';
  const packageName = req.params.package;

  res.set('Content-Type', 'text/javascript');

  try {
    // Ensure the TypeScript transpile step has completed first.
    if (needsTranspile(packageName)) {
      await queueTranspile(packageName);
    }

    // Allows you to selectively run tests by adding the `?test=` to the URL.
    const testFilter = req.query.filter || '**/test-*.mjs';
    const bundle = await rollup({
      input: `./test/${packageName}/sw/` + testFilter,
      plugins: [
        multiEntry(),
        nodeResolve({
          moduleDirectories: ['packages', 'node_modules'],
        }),
        // TODO(philipwalton): some of our shared testing helpers use commonjs
        // so we have to support this for the time being.
        commonjs({
          exclude: '*.mjs',
        }),
        replace({
          'preventAssignment': true,
          'process.env.NODE_ENV': JSON.stringify(env),
          'SW_NAMESPACES': JSON.stringify(SW_NAMESPACES),
          'WORKBOX_CDN_ROOT_URL': '/__WORKBOX/buildFile',
        }),
      ],
      // Fail in the case of warning, so rebuilds work.
      onwarn({loc, message}) {
        if (loc) {
          message = `${loc.file} (${loc.line}:${loc.column}) ${message}`;
        }
        throw new Error(message);
      },
      cache: caches[env],
    });

    // Update the cache so subsequent bundles are faster, and make sure it
    // keep the dev/prod caches separate since the source files won't change
    // between those builds, but the outputs will.
    caches[env] = bundle.cache;

    const {output} = await bundle.generate({format: 'iife'});

    res.send(output[0].code);
  } catch (error) {
    res.status(400).send('');
    console.error(error);
  }
}

module.exports = {
  handler,
  match,
};
