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
      globPattern: 'packages/*/**/*.{js,mjs}',
      globOptions: {
        ignore: [
          '**/node_modules/**/*',
        ],
      },
    }),

    new AggregateSizePlugin(),
  ],
};
