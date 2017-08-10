const uglify = require('rollup-plugin-uglify-es');
const replace = require('rollup-plugin-replace');

module.exports = {
  // This is a directory that should not be commited
  // to git and will be removed and rebuilt between
  // test runs.
  BUILD_DIRNAME: 'build',
  BROWSER_BUILD_DIRNAME: 'browser-bundles',
  TEST_BUNDLE_BUILD_DIRNAME: 'bundle-build',

  // This is the environments that we should use for NODE_ENV.
  BUILD_TYPES: [undefined, 'production'],

  // Every use of rollup should have minification and the replace
  // plugin set up and used to ensure as consist set of tests
  // as possible.
  getDefaultRollupPlugins: (buildType) => {
    const plugins = [
      uglify({
        mangle: {
          properties: {
            reserved: [
              // Chai uses this.
              '_obj',
            ],
            // mangle > properties > regex will allow uglify-es to minify
            // private variable and names.
            regex: /^_/,
            // If you are getting an error due to a property mangle
            // set this flag to true and the property will be changed
            // from '_foo' to '$_foo$' to help diagnose the problem.
            debug: true,
          },
        },
      }),
    ];

    if (buildType) {
      // Replace allows us to input NODE_ENV and strip code accordingly
      plugins.push(replace({
        'process.env.NODE_ENV': JSON.stringify(buildType),
      }));
    }

    return plugins;
  },
};
