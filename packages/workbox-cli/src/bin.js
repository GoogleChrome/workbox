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

const app = require('./index.js');
const chalk = require('chalk');
const helpText = require('./help-text');
const meow = require('meow');
const updateNotifier = require('update-notifier');

(async () => {
  const params = meow(helpText);
  updateNotifier({pkg: params.pkg}).notify();

  try {
    await app(params);
  } catch (error) {
    console.error('\n', chalk.red(error.message));
    // Exit the process with a non-0 code to indicate an error.
    params.showHelp(1);
  }
})();
