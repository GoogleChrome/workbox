/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const fse = require('fs-extra');
const semver = require('semver');
const upath = require('upath');

const githubHelper = require('./utils/github-helper');
const logHelper = require('../infra/utils/log-helper');
const publishHelpers = require('./utils/publish-helpers');

async function publishReleaseOnGithub(tagName, releaseInfo, tarPath, zipPath) {
  if (!releaseInfo) {
    const releaseData = await githubHelper.createRelease({
      tag_name: tagName,
      draft: true,
      name: `Workbox ${tagName}`,
      prerelease: semver.prerelease(tagName) !== null,
    });
    releaseInfo = releaseData.data;
  }

  const tarBuffer = await fse.readFile(tarPath);
  await githubHelper.uploadAsset({
    url: releaseInfo.upload_url,
    file: tarBuffer,
    contentType: 'application/gzip',
    contentLength: tarBuffer.length,
    name: upath.basename(tarPath),
    label: upath.basename(tarPath),
  });

  const zipBuffer = await fse.readFile(zipPath);
  await githubHelper.uploadAsset({
    url: releaseInfo.upload_url,
    file: zipBuffer,
    contentType: 'application/zip',
    contentLength: zipBuffer.length,
    name: upath.basename(zipPath),
    label: upath.basename(zipPath),
  });
}

async function handleGithubRelease(tagName, gitBranch, releaseInfo) {
  logHelper.log(`Creating GitHub release ${logHelper.highlight(tagName)}.`);

  const {tarPath, zipPath} = await publishHelpers.createBundles(tagName,
      gitBranch);

  await publishReleaseOnGithub(tagName, releaseInfo, tarPath, zipPath);
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
  const tagsToBuild = filterTagsWithReleaseBundles(allTags,
      taggedReleases);

  if (tagsToBuild.length === 0) {
    logHelper.log(`No tags missing from GitHub.`);
    return;
  }

  for (const tagToBuild of tagsToBuild) {
    await handleGithubRelease(tagToBuild.name, tagToBuild.name,
        taggedReleases[tagToBuild.name]);
  }
}

module.exports = {
  publish_github,
};
