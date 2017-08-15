const gulp = require('gulp');
const path = require('path');


const generateReleaseFiles = require('./utils/generate-release-files');
const githubHelper = require('./utils/github-helper');
const logHelper = require('./utils/log-helper');

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

const findReleasesForTags = async (tagNames) => {
  const releasesData = await githubHelper.getReleases();

  const allReleases = releasesData.data;
  return tagNames.map((tagData) => {
    let matchingRelease = null;

    allReleases.forEach((release) => {
      if (release.tag_name === tagData.name) {
        matchingRelease = release;
      }
    });

    return {
      tagData: tagData,
      release: matchingRelease,
    };
  });
};

const filterTagsWithReleaseBundles = (tagsAndReleases) => {
  return tagsAndReleases.filter((tagAndRelease) => {
    const release = tagAndRelease.release;
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
  const tags = await githubHelper.getTags();

  let tagsAndReleaseData = await findReleasesForTags(tags);
  tagsAndReleaseData = await filterTagsWithReleaseBundles(tagsAndReleaseData);

  if (tagsAndReleaseData.length === 0) {
    logHelper.log(`No tags missing from Github.`);
  }

  for (let tagAndRelease of tagsAndReleaseData) {
    const tag = tagAndRelease.tagData;
    const release = tagAndRelease.release;
    await handleGithubRelease(tag.name, tag.name, release);
  }
});

// TODO: Delete this task when v3 is about to launch.
gulp.task('publish-github:temp-v3', async () => {
  const tagName = 'v3.0.0-alpha';
  const gitBranch = 'v3';

  let tagsAndReleaseData = await findReleasesForTags([{name: tagName}]);
  tagsAndReleaseData = filterTagsWithReleaseBundles(tagsAndReleaseData);

  for (let tagAndRelease of tagsAndReleaseData) {
    const tag = tagAndRelease.tagData;
    const release = tagAndRelease.release;
    // Override the git branch here since we aren't actually
    // using a tagged release.
    await handleGithubRelease(tag.name, gitBranch, release);
  }
});

gulp.task('publish-github', gulp.series(
  'publish-github:generate-from-tags',
  'publish-github:temp-v3',
));
