module.exports = {
  // This is a directory that should not be commited
  // to git and will be removed and rebuilt between
  // test runs.
  PACKAGE_BUILD_DIRNAME: 'build',
  GENERATED_RELEASE_FILES_DIRNAME: 'generated-release-files',

  // This is used in the publish-bundle step to avoid doing anything
  // with tags < v3.0.0.
  MIN_RELEASE_TAG_TO_PUBLISH: 'v3.0.0',
  GITHUB_OWNER: 'GoogleChrome',
  GITHUB_REPO: 'workbox',

  // This is the environments that we should use for NODE_ENV.
  BUILD_TYPES: {
    dev: 'dev',
    prod: 'production',
  },

  // This is used in demos directory when referencing local files
  LOCAL_BUILDS_DIR: 'local-builds',
};
