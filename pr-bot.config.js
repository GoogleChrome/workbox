const prbot = require('pr-bot');

const AggregateSizePlugin = require('./infra/pr-bot/aggregate-size-plugin.js');

module.exports = {
  buildCommand: `npm install && gulp build`,
  botUsername: `workbox-pr-bot`,

  // This is required until v3 is the primary branch (i.e. moved to master)
  overrideBaseBranch: 'v3',

  repoDetails: {
    owner: 'GoogleChrome',
    repo: 'workbox',
  },
  plugins: [
    new prbot.plugins.Size({
      globPattern: 'packages/*/build/*.js',
      globOptions: {
        ignore: [
          'packages/*/build/*.dev.js',
          '**/node_modules/**/*',
        ],
      },
    }),

    new AggregateSizePlugin(),
  ],
};
