const gulp = require('gulp');
const cdnUploadHelper = require('./utils/cdn-helper');

const generateReleaseFiles = require('./utils/generate-release-files');
const githubHelper = require('./utils/github-helper');
const logHelper = require('../infra/utils/log-helper');

const findMissingCDNTags = async (tagsData) => {
  const missingTags = [];
  for (let tagData of tagsData) {
    const exists = await cdnUploadHelper.tagExists(tagData.name);
    if (!exists) {
      missingTags.push(tagData);
    }
  }
  return missingTags;
};

const handleCDNUpload = async (tagName, gitBranch) => {
  // First attempt to generate the files. If this fails, we won't have
  // generated an empty Github release.
  const releaseFileDetails = await generateReleaseFiles(tagName, gitBranch);
  logHelper.log(`Uploading '${tagName}' to CDN.`);
  await cdnUploadHelper.upload(tagName, releaseFileDetails.buildFilesPath);
};

gulp.task('publish-cdn:generate-from-tags', async () => {
  // Get all of the tags in the repo.
  const tags = await githubHelper.getTags();

  const missingTags = await findMissingCDNTags(tags);

  if (missingTags.length === 0) {
    logHelper.log(`No tags missing from CDN.`);
  }

  for (let tagData of missingTags) {
    // Override the git branch here since we aren't actually
    // using a tagged release.
    await handleCDNUpload(tagData.name, tagData.name);
  }
});

gulp.task('publish-cdn:temp-v3', async () => {
  const tagName = 'v3.0.0-alpha';
  const gitBranch = 'v3';

  const missingTags = await findMissingCDNTags([{name: tagName}]);
  for (let tagData of missingTags) {
    // Override the git branch here since we aren't actually
    // using a tagged release.
    await handleCDNUpload(tagData.name, gitBranch);
  }
});

// This gives the google-cloud/storage module a change to complain
// before any of the pubslish bundle work kicks in.
gulp.task('publish-cdn:init', () => cdnUploadHelper.init());

gulp.task('publish-cdn', gulp.series(
  'publish-cdn:init',
  'publish-cdn:generate-from-tags',
  'publish-cdn:temp-v3',
));
