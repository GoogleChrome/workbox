const gulp = require('gulp');
const path = require('path');

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
    });
    releaseInfo = releaseData.data;
  }

  await githubHelper.uploadAsset({
    id: releaseInfo.id,
    filePath: tarPath,
    name: path.basename(tarPath),
    label: path.basename(tarPath),
  });

  await githubHelper.uploadAsset({
    id: releaseInfo.id,
    filePath: zipPath,
    name: path.basename(zipPath),
    label: path.basename(zipPath),
  });
};

const handleGithubRelease = async (tagName, gitBranch, releaseInfo) => {
  logHelper.log(`Creating Github release ${logHelper.highlight(tagName)}.`);

  const {tarPath, zipPath} =
    await publishHelpers.createBundles(tagName, gitBranch);

  return publishReleaseOnGithub(tagName, releaseInfo, tarPath, zipPath);
};

const filterTagsWithReleaseBundles = (taggedReleases) => {
  return Object.keys(taggedReleases).filter((tagName) => {
    const release = taggedReleases[tagName];
    if (release && release.assets.length > 0) {
      // If a tag has a release and there is an asset let's assume the
      // the release is fine. Note: Github's source doesn't count as an
      // asset
      return false;
    }

    return true;
  });
};

gulp.task('publish-github:generate-from-tags', async () => {
  // Get all of the tags in the repo.
  const taggedReleases = await githubHelper.getTaggedReleases();
  const tagsToBuild = await filterTagsWithReleaseBundles(taggedReleases);

  if (tagsToBuild.length === 0) {
    logHelper.log(`No tags missing from Github.`);
  }

  for (let tagName of tagsToBuild) {
    await handleGithubRelease(tagName, tagName, taggedReleases[tagName]);
  }
});

gulp.task('publish-github', gulp.series(
  'publish-github:generate-from-tags',
));
