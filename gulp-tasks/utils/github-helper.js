/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const GitHubApi = require('@octokit/rest');
const semver = require('semver');

const constants = require('./constants');

const github = new GitHubApi();

// github.authenticate() is synchronous, and it only stores the credentials for
// the next request, so it should be called once per method that requires auth.
// See https://github.com/mikedeboer/node-github#authentication
const authenticate = () => {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error(
      'You must set a GITHUB_TOKEN in your environment to ' +
        'publish a GitHub release.',
    );
  }

  github.authenticate({
    type: 'token',
    token: process.env.GITHUB_TOKEN,
  });
};

module.exports = {
  createRelease: (args) => {
    authenticate();
    args.owner = constants.GITHUB_OWNER;
    args.repo = constants.GITHUB_REPO;
    return github.repos.createRelease(args);
  },

  uploadAsset: (args) => {
    authenticate();
    args.owner = constants.GITHUB_OWNER;
    args.repo = constants.GITHUB_REPO;
    return github.repos.uploadAsset(args);
  },

  getTaggedReleases: async () => {
    authenticate();
    const releasesData = await github.repos.getReleases({
      owner: constants.GITHUB_OWNER,
      repo: constants.GITHUB_REPO,
    });

    const releases = releasesData.data;
    const releasesByTags = {};
    releases.forEach((release) => {
      const tagName = release.tag_name;
      if (semver.gte(tagName, constants.MIN_RELEASE_TAG_TO_PUBLISH)) {
        releasesByTags[tagName] = release;
      }
    });

    return releasesByTags;
  },

  getTags: async () => {
    authenticate();
    const tagsResponse = await github.repos.getTags({
      owner: constants.GITHUB_OWNER,
      repo: constants.GITHUB_REPO,
    });

    const tagsData = tagsResponse.data;
    return tagsData.filter((tagData) => {
      return semver.gte(tagData.name, constants.MIN_RELEASE_TAG_TO_PUBLISH);
    });
  },
};
