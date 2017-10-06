const gulp = require('gulp');

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

gulp.task('test-server:prod', () => {
  process.env.NODE_ENV = 'production';
  startServer();
});

gulp.task('test-server', () => {
  process.env.NODE_ENV = 'dev';
  startServer();
});
