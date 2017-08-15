const GitHubApi = require('github');
const semver = require('semver');

const constants = require('./constants');

const GITHUB_OWNER = 'GoogleChrome';
const GITHUB_REPO = 'workbox';

const github = new GitHubApi();

github.authenticate({
  type: 'token',
  token: process.env.GITHUB_TOKEN,
});

module.exports = {
  createRelease: (args) => {
    args.owner = GITHUB_OWNER;
    args.repo = GITHUB_REPO;
    return github.repos.createRelease(args);
  },

  uploadAsset: (args) => {
    args.owner = GITHUB_OWNER;
    args.repo = GITHUB_REPO;
    return github.repos.uploadAsset(args);
  },

  getReleases: () => {
    return github.repos.getReleases({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
    });
  },

  getTags: async () => {
    const tagsResponse = await github.repos.getTags({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
    });

    // We only want tags that are v3.0.0 or above.
    const tagsData = tagsResponse.data;
    return tagsData.filter((tagData) => {
      return semver.gte(tagData.name, constants.MIN_RELEASE_TAG_TO_PUBLISH);
    });
  },
};
