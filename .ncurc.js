// We use `npx npm-check-updates` to find updates to dependencies.
// Some dependencies have breaking changes that we can't resolve.
// This config file excludes those dependencies from the checks
// until we're able to remediate our code to deal with them.

module.exports = {
  reject: [
    // See https://github.com/GoogleChrome/workbox/issues/2479
    '@octokit/rest',
    'rollup',
    'service-worker-mock',
    // See https://github.com/GoogleChrome/workbox/issues/2602
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
  ],
};
