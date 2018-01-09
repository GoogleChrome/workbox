const gulp = require('gulp');

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

const testServerProd = () => {
  process.env.NODE_ENV = constants.BUILD_TYPES.prod;
  startServer();
};
// GULP: Is this exposed to the CLI?
// GULP: This should probably be a CLI flag like `--prod`
gulp.task('test-server:prod', testServerProd);

const testServerDev = () => {
  process.env.NODE_ENV = constants.BUILD_TYPES.dev;
  startServer();
};
testServerDev.displayName = 'test-server';

module.exports = testServerDev;
