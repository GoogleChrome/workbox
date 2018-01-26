const getNpmCmd = require('./utils/get-npm-cmd');
// GULP: We handle async completion on child processes
const spawn = require('./utils/spawn-promise-wrapper');

const publishLerna = () => {
  return spawn(getNpmCmd(), [
    'run', 'local-lerna',
    '--',
    'publish',

    // TODO: The following flags are for testing deploy process and can
    // be removed

    '--cd-version=prerelease', '--preid=alpha',
    '--npm-tag', 'alpha',
  ]);
};
publishLerna.displayName = 'publish-lerna';

module.exports = publishLerna;
