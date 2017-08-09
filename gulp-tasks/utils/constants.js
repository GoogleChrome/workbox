module.exports = {
  // This is a directory that should not be commited
  // to git and will be removed and rebuilt between
  // test runs.
  BUILD_DIRNAME: 'build',
  BROWSER_BUILD_DIRNAME: 'browser-bundles',
  TEST_BUNDLE_BUILD_DIRNAME: 'bundle-build',
  BUILD_TYPES: [undefined, 'production'],
};
