/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const gulp = require('gulp');

const constants = require('./utils/constants');
const testServer = require('../infra/testing/server/index');

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
  for (const eventName of eventNames) {
    process.on(eventName, handleExit);
  }

  return testServer.start();
};

gulp.task('test-server', () => {
  process.env.NODE_ENV = process.env.NODE_ENV || constants.BUILD_TYPES.dev;
  startServer();
});
