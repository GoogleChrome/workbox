const constants = require('./utils/constants');
const testServer = require('../infra/testing/test-server');

const handleExit = () => {
  testServer.stop();
  process.exit(0);
};

const startServer = () => {
  const eventNames = [
    'exit',
    'SIGINT',
    'SIGUSR1',
    'SIGUSR2',
    'uncaughtException',
  ];
  eventNames.forEach((eventName) => {
    process.on(eventName, handleExit);
  });

  return testServer.start();
};

// GULP: This is not used?
// GULP: This should probably be a CLI flag like `--prod`
const testServerProd = () => {
  process.env.NODE_ENV = constants.BUILD_TYPES.prod;
  startServer();
};
testServerProd.displayName = 'test-server:prod';

const testServerDev = () => {
  process.env.NODE_ENV = constants.BUILD_TYPES.dev;
  startServer();
};
testServerDev.displayName = 'test-server';

module.exports = testServerDev;
