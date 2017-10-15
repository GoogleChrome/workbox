const gulp = require('gulp');
const path = require('path');
const fs = require('fs-extra');

const cdnUploadHelper = require('./utils/cdn-helper');
const publishHelpers = require('./utils/publish-helpers');
const githubHelper = require('./utils/github-helper');
const logHelper = require('../infra/utils/log-helper');
const constants = require('./utils/constants');

const findMissingCDNTags = async (tagsData) => {
  const missingTags = [];
  for (let tagData of tagsData) {
    let exists = await cdnUploadHelper.tagExists(tagData.name);

    if (tagData.name.includes('3.0.0-alpha')) {
      exists = false;
    }

    if (!exists) {
      missingTags.push(tagData);
    }
  }
  return missingTags;
};

const handleCDNUpload = async (tagName, gitBranch) => {
  const buildFilesDir =
    await publishHelpers.groupBuildFiles(tagName, gitBranch);

  logHelper.log(`Uploading '${tagName}' to CDN.`);
  const publishUrls = await cdnUploadHelper.upload(tagName, buildFilesDir);

  logHelper.log(`The following URLs are now avaiable:`);
  publishUrls.forEach((url) => {
    // Only print out the js files just for cleaner logs.
    if (path.extname(url) === '.map') {
      return;
    }

    logHelper.log(`    ${url}`);
  });
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
  // Let's force this to always be fresh - in case we run it outside of
  // gulp publish
  await fs.remove(
    path.join(__dirname, '..', constants.GENERATED_RELEASE_FILES_DIRNAME));

  const lernaPkg = await fs.readJSON(
    path.join(__dirname, '..', 'lerna.json'),
  );
  const tagName = lernaPkg.version;
  const gitBranch = 'v3';

  const missingTags = await findMissingCDNTags([{name: tagName}]);
  logHelper.log(missingTags);
  for (let tagData of missingTags) {
    // Override the git branch here since we aren't actually
    // using a tagged release.
    await handleCDNUpload(tagData.name, gitBranch);
  }
});

gulp.task('publish-cdn', gulp.series(
  'publish-cdn:generate-from-tags',
  'publish-cdn:temp-v3',
));
