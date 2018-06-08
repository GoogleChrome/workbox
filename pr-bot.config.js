const prBot = require('pr-bot');

const AggregateSizePlugin = require('./infra/pr-bot/aggregate-size-plugin.js');

module.exports = {
  buildCommand: `npm install && gulp build`,
  botUsername: `workbox-pr-bot`,
  repoDetails: {
    owner: 'GoogleChrome',
    repo: 'workbox',
  },
  plugins: [
    new prBot.plugins.Size({
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
