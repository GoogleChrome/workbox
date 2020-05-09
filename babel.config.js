const NODE_PACKAGES = [
  'workbox-build',
  'workbox-cli',
  'workbox-webpack-plugin',
];

function isOneOf(filename, packages) {
  return packages.some((package) => filename.includes(`/${package}/`));
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
