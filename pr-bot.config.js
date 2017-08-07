const prbot = require('pr-bot');

module.exports = {
  buildCommand: `npm install && gulp test`,
  botUsername: `workbox-pr-bot`,

  // This is required until v3 is the primary branch (i.e. moved to master)
  overrideBaseBranch: 'v3',

  repoDetails: {
    owner: 'GoogleChrome',
    repo: 'workbox',
  },
  plugins: [
    new prbot.plugins.Size({
      globPattern: 'packages/*/src/**/*.js',
      globOptions: {
        ignore: [
          '**/node_modules/**/*',
        ],
      },
    }),
  ],
};
