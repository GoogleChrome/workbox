const uglify = require('rollup-plugin-uglify-es');
const replace = require('rollup-plugin-replace');

module.exports = {
  // Every use of rollup should have minification and the replace
  // plugin set up and used to ensure as consist set of tests
  // as possible.
  getDefaultPlugins: (buildType) => {
    // TODO: Once rollup-plugin-uglify-es is updated, use keep_classnames
    // for dev.
    // https://github.com/ezekielchentnik/rollup-plugin-uglify-es/issues/1
    const plugins = [
      uglify({
        mangle: {
          properties: {
            reserved: [
              // Chai will break unless we reserve this private variable.
              '_obj',
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
