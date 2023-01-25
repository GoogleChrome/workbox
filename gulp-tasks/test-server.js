/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {series} = require('gulp');

const {
  transpile_typescript,
  transpile_typescript_watch,
} = require('./transpile-typescript');
const constants = require('./utils/constants');
const testServer = require('../infra/testing/server/index');

function handleExit() {
  testServer.stop();
  process.exit(0);
}

function startServer() {
  process.env.NODE_ENV = process.env.NODE_ENV || constants.BUILD_TYPES.dev;

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
}

module.exports = {
  test_server: series(
    transpile_typescript,
    startServer,
    transpile_typescript_watch,
  ),
};
