/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const gulp = require('gulp');
const path = require('path');
const semver = require('semver');
const fs = require('fs-extra');

const publishHelpers = require('./utils/publish-helpers');
const githubHelper = require('./utils/github-helper');
const logHelper = require('../infra/utils/log-helper');

const publishReleaseOnGithub =
  async (tagName, releaseInfo, tarPath, zipPath) => {
    if (!releaseInfo) {
      const releaseData = await githubHelper.createRelease({
        tag_name: tagName,
        draft: true,
        name: `Workbox ${tagName}`,
        prerelease: semver.prerelease(tagName) !== null,
      });
      releaseInfo = releaseData.data;
    }

    const tarBuffer = await fs.readFile(tarPath);
    await githubHelper.uploadAsset({
      url: releaseInfo.upload_url,
      file: tarBuffer,
      contentType: 'application/gzip',
      contentLength: tarBuffer.length,
      name: path.basename(tarPath),
      label: path.basename(tarPath),
    });

    const zipBuffer = await fs.readFile(zipPath);
    await githubHelper.uploadAsset({
      url: releaseInfo.upload_url,
      file: zipBuffer,
      contentType: 'application/zip',
      contentLength: zipBuffer.length,
      name: path.basename(zipPath),
      label: path.basename(zipPath),
    });
  };

const handleGithubRelease = async (tagName, gitBranch, releaseInfo) => {
  logHelper.log(`Creating GitHub release ${logHelper.highlight(tagName)}.`);

  const {tarPath, zipPath} =
    await publishHelpers.createBundles(tagName, gitBranch);

  return publishReleaseOnGithub(tagName, releaseInfo, tarPath, zipPath);
};

const filterTagsWithReleaseBundles = (allTags, taggedReleases) => {
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
};

gulp.task('publish-github:generate-from-tags', async () => {
  // Get all of the tags in the repo.
  const allTags = await githubHelper.getTags();
  const taggedReleases = await githubHelper.getTaggedReleases();
  const tagsToBuild = await filterTagsWithReleaseBundles(
      allTags, taggedReleases);

  if (tagsToBuild.length === 0) {
    logHelper.log(`No tags missing from GitHub.`);
    return;
  }

  for (const tagInfo of tagsToBuild) {
    await handleGithubRelease(
        tagInfo.name, tagInfo.name, taggedReleases[tagInfo.name]);
  }
});

gulp.task('publish-github', gulp.series(
    'publish-github:generate-from-tags',
));
