/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const semver = require('semver');

const githubHelper = require('./utils/github-helper');
const logHelper = require('../infra/utils/log-helper');

async function publishReleaseOnGithub(tagName, releaseInfo) {
  if (!releaseInfo) {
    const releaseData = await githubHelper.createRelease({
      tag_name: tagName,
      draft: true,
      name: `Workbox ${tagName}`,
      prerelease: semver.prerelease(tagName) !== null,
    });
    releaseInfo = releaseData.data;
  }
}

async function handleGithubRelease(tagName, gitBranch, releaseInfo) {
  logHelper.log(`Creating GitHub release ${logHelper.highlight(tagName)}.`);

  await publishReleaseOnGithub(tagName, releaseInfo);
}

function filterTagsWithReleaseBundles(allTags, taggedReleases) {
  return allTags.filter((tagInfo) => {
    const release = taggedReleases[tagInfo.name];
    if (release && release.assets.length > 0) {
      // If a tag has a release and there is an asset let's assume the
      // the release is fine. Note: GitHub's source doesn't count as an
      // asset
      return false;
    }

    return true;
  });
}

async function publish_github() {
  // Get all of the tags in the repo.
  const allTags = await githubHelper.getTags();
  const taggedReleases = await githubHelper.getTaggedReleases();
  const tagsToBuild = filterTagsWithReleaseBundles(allTags, taggedReleases);

  if (tagsToBuild.length === 0) {
    logHelper.log(`No tags missing from GitHub.`);
    return;
  }

  for (const tagToBuild of tagsToBuild) {
    await handleGithubRelease(
      tagToBuild.name,
      tagToBuild.name,
      taggedReleases[tagToBuild.name],
    );
  }
}

module.exports = {
  publish_github,
};
