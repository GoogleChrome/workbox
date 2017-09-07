module.exports = {
  // This is a directory that should not be commited
  // to git and will be removed and rebuilt between
  // test runs.
  PACKAGE_BUILD_DIRNAME: 'builds',
  BROWSER_BUILD_DIRNAME: 'browser',
  TEST_BUNDLES_BUILD_DIRNAME: 'bundle-builds',
  GENERATED_RELEASE_FILES_DIRNAME: 'generated-release-files',

  // This is used in the publish-bundle step to avoid doing anything
  // with tags < v3.0.0.
  // The "-alpha" means semver will match against tags with prelease
  // info (although the prelease tag must be a string >= 'alpha'
  // alphabetically speaking).
  // TODO: Change to v3.0.0 when v3 is launched to avoid doing anything
  // with prelease versions.
  MIN_RELEASE_TAG_TO_PUBLISH: 'v3.0.0-alpha',
  GITHUB_OWNER: 'GoogleChrome',
  GITHUB_REPO: 'workbox',

  // This is the namespace of the workbox module.
  NAMESPACE_PREFIX: 'workbox',

  // This is the environments that we should use for NODE_ENV.
  BUILD_TYPES: ['dev', 'production'],
};
