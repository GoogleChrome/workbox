const gulp = require('gulp');
const path = require('path');


const generateReleaseFiles = require('./utils/generate-release-files');
const githubHelper = require('./utils/github-helper');
const logHelper = require('../infra/utils/log-helper');

const handleGithubRelease = async (tagName, gitBranch, release) => {
  // First attempt to generate the files. If this fails, we won't have
  // generated an empty Github release.
  const releaseFileDetails = await generateReleaseFiles(tagName, gitBranch);

  if (!release) {
    const releaseData = await githubHelper.createRelease({
      tag_name: tagName,
      draft: true,
      name: `Workbox ${tagName}`,
    });
    release = releaseData.data;
  }

  await githubHelper.uploadAsset({
    id: release.id,
    filePath: releaseFileDetails.tarPath,
    name: path.basename(releaseFileDetails.tarPath),
    label: path.basename(releaseFileDetails.tarPath),
  });

  await githubHelper.uploadAsset({
    id: release.id,
    filePath: releaseFileDetails.zipPath,
    name: path.basename(releaseFileDetails.zipPath),
    label: path.basename(releaseFileDetails.zipPath),
  });
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

// TODO: Delete this task when v3 is about to launch.
gulp.task('publish-github:temp-v3', async () => {
  const tagName = 'v3.0.0-alpha';
  const gitBranch = 'v3';

  const taggedReleases = await githubHelper.getTaggedReleases();
  const tagsToBuild = await filterTagsWithReleaseBundles([
    taggedReleases[tagName],
  ]);

  for (let tagName of tagsToBuild) {
    // Override the git branch here since we aren't actually
    // using a tagged release.
    await handleGithubRelease(tagName, gitBranch, taggedReleases[tagName]);
  }
});

gulp.task('publish-github', gulp.series(
  'publish-github:generate-from-tags',
  'publish-github:temp-v3',
));
