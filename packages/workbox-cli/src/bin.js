#! /usr/bin/env node

/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
**/

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
    await app(...params.input);
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
