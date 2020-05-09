const NODE_PACKAGES = [
  'workbox-build',
  'workbox-cli',
  'workbox-webpack-plugin',
];

/**
 * @param {string} filename
 * @param {Array<string>} packages
 * @return {boolean} true iff filename belongs to one of the packages
 */
function isOneOf(filename, packages) {
  return packages.some((pkg) => filename.includes(`/${pkg}/`));
}

module.exports = {
  overrides: [{
    test: (filename) => isOneOf(filename, NODE_PACKAGES),
    presets: [
      ['@babel/preset-env', {
        targets: {
          // Change this when our minimum required node version changes.
          node: '10.0',
        },
      }],
    ],
  }],
};
