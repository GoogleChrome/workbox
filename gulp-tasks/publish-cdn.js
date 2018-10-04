const gulp = require('gulp');
const path = require('path');

const cdnUploadHelper = require('./utils/cdn-helper');
const publishHelpers = require('./utils/publish-helpers');
const githubHelper = require('./utils/github-helper');
const logHelper = require('../infra/utils/log-helper');

// Git adds 'v' to tag name, lerna does not in package.json version.
// We are going to publish to CDN *without* the 'v'
const cleanTagName = (name) => {
  let friendlyTagName = name;
  if (friendlyTagName.indexOf('v') === 0) {
    friendlyTagName = friendlyTagName.substring(1);
  }
  return friendlyTagName;
};

const findMissingCDNTags = async (tagsData) => {
  const missingTags = [];
  for (let tagData of tagsData) {
    let exists = await cdnUploadHelper.tagExists(cleanTagName(tagData.name));

    if (!exists) {
      missingTags.push(tagData);
    }
  }
  return missingTags;
};

const handleCDNUpload = async (tagName, gitBranch) => {
  const buildFilesDir =
    await publishHelpers.groupBuildFiles(tagName, gitBranch);

  const friendlyTagName = cleanTagName(tagName);

  logHelper.log(`Uploading '${tagName}' to CDN as ${friendlyTagName}.`);
  const publishUrls = await cdnUploadHelper.upload(
      friendlyTagName, buildFilesDir);

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

gulp.task('publish-cdn', gulp.series(
    'publish-cdn:generate-from-tags',
));
