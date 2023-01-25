/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {babel} = require('@rollup/plugin-babel');
const {nodeResolve} = require('@rollup/plugin-node-resolve');
const asyncToPromises = require('babel-plugin-transform-async-to-promises');
const replace = require('@rollup/plugin-replace');
const terserPlugin = require('rollup-plugin-terser').terser;

const constants = require('./constants');
const getVersionsCDNUrl = require('./versioned-cdn-url');

// See https://github.com/GoogleChrome/workbox/issues/1674
const nameCache = {};

module.exports = {
  // Every use of rollup should have minification and the replace
  // plugin set up and used to ensure as consist set of tests
  // as possible.
  getDefaultPlugins: (buildType, buildFormat = 'iife', es5 = false) => {
    const plugins = [nodeResolve()];

    const babelConfig = {
      babelHelpers: 'bundled',
      presets: [
        [
          '@babel/preset-env',
          {
            loose: true,
            targets: {
              browsers: es5
                ? // If es5 is true, target IE11
                  // https://github.com/browserslist/browserslist#queries
                  ['ie 11']
                : // This corresponds to the version of Chromium used by
                  // Samsung Internet 6.x, which is the minimum non-evergreen
                  // browser we currently support.
                  ['chrome >= 56'],
            },
          },
        ],
      ],
    };
    if (es5) {
      babelConfig.plugins = [asyncToPromises];
    }
    plugins.push(babel(babelConfig));

    const minifyBuild = buildType === constants.BUILD_TYPES.prod;
    if (minifyBuild) {
      const terserOptions = {
        nameCache,
        module: buildFormat === 'esm' ? true : false,
        mangle: {
          properties: {
            reserved: [
              // Chai will break unless we reserve this private variable.
              '_obj',
              // We need this to be exported correctly.
              '_private',
              // See https://github.com/GoogleChrome/workbox/issues/2686
              '_handle',
            ],
            // mangle > properties > regex will allow terser to minify
            // private variable and names that start with a single underscore
            // followed by a letter. This restriction to avoid mangling
            // unintentional fields in our or other libraries code.
            regex: /^_[A-Za-z]/,
            // If you are getting an error due to a property mangle
            // set this flag to true and the property will be changed
            // from '_foo' to '$_foo$' to help diagnose the problem.
            debug: false,
          },
        },
      };
      plugins.push(terserPlugin(terserOptions));
    }

    // This is what the build should be
    const replaceOptions = {
      preventAssignment: true,
      WORKBOX_CDN_ROOT_URL: getVersionsCDNUrl(),
    };

    if (buildType) {
      replaceOptions['process.env.NODE_ENV'] = JSON.stringify(buildType);
    }

    // Replace allows us to input NODE_ENV and strip code accordingly
    plugins.push(replace(replaceOptions));

    return plugins;
  },
};
