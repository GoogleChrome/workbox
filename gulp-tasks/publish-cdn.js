/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const upath = require('upath');

const cdnUploadHelper = require('./utils/cdn-helper');
const githubHelper = require('./utils/github-helper');
const logHelper = require('../infra/utils/log-helper');
const publishHelpers = require('./utils/publish-helpers');

// Git adds 'v' to tag name, lerna does not in package.json version.
// We are going to publish to CDN *without* the 'v'
function cleanTagName(name) {
  let friendlyTagName = name;

  if (friendlyTagName.startsWith('v')) {
    friendlyTagName = friendlyTagName.substring(1);
  }

  return friendlyTagName;
}

async function findMissingCDNTags(tagsData) {
  const missingTags = [];

  for (const tagData of tagsData) {
    const exists = await cdnUploadHelper.tagExists(cleanTagName(tagData.name));

    if (!exists) {
      missingTags.push(tagData);
    }
  }

  return missingTags;
}

async function handleCDNUpload(tagName, gitBranch) {
  const buildDir = await publishHelpers.groupBuildFiles(tagName, gitBranch);

  const friendlyTagName = cleanTagName(tagName);

  logHelper.log(`Uploading '${tagName}' to the CDN as ${friendlyTagName}.`);
  const urls = await cdnUploadHelper.upload(friendlyTagName, buildDir);

  logHelper.log('The following URLs are now available:');
  for (const url of urls) {
    // Skip the .map for cleaner logs.
    if (upath.extname(url) !== '.map') {
      logHelper.log(`• ${url}`);
    }
  }
}

async function publish_cdn() {
  // Get all of the tags in the repo.
  const tags = await githubHelper.getTags();
  const missingTags = await findMissingCDNTags(tags);

  if (missingTags.length === 0) {
    logHelper.log('No tags missing from CDN.');
  }

  for (const missingTag of missingTags) {
    // Override the git branch here since we aren't actually
    // using a tagged release.
    await handleCDNUpload(missingTag.name, missingTag.name);
  }
}

module.exports = {
  publish_cdn,
};
