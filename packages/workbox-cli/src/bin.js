#! /usr/bin/env node

/**
 * Copyright 2016 Google Inc.
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
'use strict';

const meow = require('meow');
const cliHelpText = require('./cli-help');
const CLI = require('./index.js');

/* eslint-disable no-console */
// argv[0] is the path to the node runtime.
// argv[1] is the path to the script that node is running.
if (process.argv[1].endsWith('workbox-cli')) {
  console.warn(`Please run the command line tool as 'workbox' instead of ` +
    `'workbox-cli'.\n'workbox-cli' will stop working in the next major ` +
    `release.\n(See: https://github.com/GoogleChrome/workbox/issues/730)`);
}
/* eslint-enable no-console */

const cliInstance = new CLI();
const meowOutput = meow(cliHelpText);
cliInstance.argv(meowOutput);
