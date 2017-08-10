module.exports = {
  // This is a directory that should not be commited
  // to git and will be removed and rebuilt between
  // test runs.
  PACKAGE_BUILD_DIRNAME: 'build',
  BROWSER_BUILD_DIRNAME: 'browser-bundles',
  TEST_BUNDLES_BUILD_DIRNAME: 'bundle-builds',

  // This is the environments that we should use for NODE_ENV.
  BUILD_TYPES: [undefined, 'production'],
};
