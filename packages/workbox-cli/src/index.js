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

const assert = require('assert');
const path = require('path');
const prettyBytes = require('pretty-bytes');
const workboxBuild = require('workbox-build');

const logger = require('./lib/logger');

module.exports = async (params) => {
  const [command, configFile] = params.input;

  assert(command, `Please provide a command.`);
  assert(configFile, `Please provide a configuration file.`);

  if (command === 'wizard') {
    // TODO: Port over wizard code.
  } else if (command === 'generateSW' || command === 'injectManifest') {
    // TODO: Confirm that this works with Windows paths.
    const configPath = path.resolve(process.cwd(), configFile);
    let config;
    try {
      config = require(configPath);
    } catch (error) {
      // TODO: Switch to custom Error subclass.
      throw new Error(`${error}\n Please pass in a valid CommonJS module ` +
        `that exports your configuration.`);
    }

    try {
      const {size, count} = await workboxBuild[command](config);
      logger.log(`The service worker was written to ${config.swDest}`);
      logger.debug(`${count} files will be precached, totalling ` +
        `${prettyBytes(size)}.`);
    } catch (error) {
      // See https://github.com/hapijs/joi/blob/v11.3.4/API.md#errors
      if (typeof error.annotate === 'function') {
        // TODO: Switch to custom Error subclass.
        throw new Error(`Your configuration is invalid:\n${error.annotate()}`);
      }
      throw error;
    }
  } else {
    // TODO: Switch to custom Error subclass.
    throw new Error(`Unknown command: ${command}`);
  }
};
