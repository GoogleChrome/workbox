#! /usr/bin/env node

/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const meow = require('meow');
const updateNotifier = require('update-notifier');

const app = require('./app.js');
const cleanupStackTrace = require('./lib/cleanup-stack-trace.js');
const helpText = require('./lib/help-text');
const logger = require('./lib/logger');

(async () => {
  const params = meow(helpText);
  updateNotifier({pkg: params.pkg}).notify();

  try {
    await app(params);
  } catch (error) {
    // Show the full error and stack trace if we're run with --debug.
    if (params.flags.debug) {
      logger.error(`\n${error.stack}`);
    } else {
      logger.error(`\n${error.message}`);
      logger.debug(`${cleanupStackTrace(error, 'app.js')}\n`);
    }

    process.exit(1);
  }
})();
