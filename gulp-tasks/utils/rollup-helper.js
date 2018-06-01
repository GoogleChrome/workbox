const babel = require('rollup-plugin-babel');
const minify = require('uglify-es').minify;
const replace = require('rollup-plugin-replace');
const uglifyPlugin = require('rollup-plugin-uglify').uglify;

const constants = require('./constants');
const getVersionsCDNUrl = require('./versioned-cdn-url');

module.exports = {
  // Every use of rollup should have minification and the replace
  // plugin set up and used to ensure as consist set of tests
  // as possible.
  getDefaultPlugins: (buildType) => {
    const plugins = [];

    const babelConfig = {
      presets: [['env', {
        targets: {
          // This corresponds to the version of Chroumium used by
          // Samsung Internet 5.x, which is the minimum non-evergreen browser
          // we currently support.
          browsers: ['chrome >= 51'],
        },
        modules: false,
      }]],
      // This will result in references to `babelHelpers.asyncToGenerators()`
      // in the transpiled code. The declaration of this method lives in the
      // external-helpers.js file and is injected by Rollup once into the
      // workbox-core bundle.
      plugins: ['external-helpers'],
      externalHelpers: true,
    };
    plugins.push(babel(babelConfig));

    let minifyBuild = buildType === constants.BUILD_TYPES.prod;
    if (minifyBuild) {
      const uglifyOptions = {
        mangle: {
          properties: {
            reserved: [
              // Chai will break unless we reserve this private variable.
              '_obj',
              // We need this to be exported correctly.
              '_private',
            ],
            // mangle > properties > regex will allow uglify-es to minify
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
      plugins.push(
        uglifyPlugin(uglifyOptions, minify),
      );
    }

    // This is what the build should be
    const replaceOptions = {
      'WORKBOX_CDN_ROOT_URL': getVersionsCDNUrl(),
    };

    if (buildType) {
      replaceOptions['process.env.NODE_ENV'] = JSON.stringify(buildType);
    }

    // Replace allows us to input NODE_ENV and strip code accordingly
    plugins.push(replace(replaceOptions));

    return plugins;
  },
};
