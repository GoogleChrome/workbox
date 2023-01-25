/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

module.exports = {
  // This is a directory that should not be commited
  // to git and will be removed and rebuilt between
  // test runs.
  PACKAGE_BUILD_DIRNAME: 'build',
  GENERATED_RELEASE_FILES_DIRNAME: 'generated-release-files',

  // This is used in the publish-bundle step to avoid doing anything
  // with tags that have known issues.
  MIN_RELEASE_TAG_TO_PUBLISH: 'v6.1.5',
  GITHUB_OWNER: 'GoogleChrome',
  GITHUB_REPO: 'workbox',

  // This is the environments that we should use for NODE_ENV.
  BUILD_TYPES: {
    dev: 'dev',
    prod: 'production',
  },
};
