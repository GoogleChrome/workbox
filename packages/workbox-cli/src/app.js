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
const ol = require('common-tags').oneLine;
const path = require('path');
const prettyBytes = require('pretty-bytes');
const workboxBuild = require('workbox-build');

const constants = require('./lib/constants');
const errors = require('./lib/errors');
const logger = require('./lib/logger');
const readConfig = require('./lib/read-config');
const runWizard = require('./lib/run-wizard');

module.exports = async (params = {}) => {
  // This should not be a user-visible error, unless meow() messes something up.
  assert(Array.isArray(params.input), errors['missing-input']);

  // Default to showing the help message if there's no command provided.
  const [command = 'help', option] = params.input;

  switch (command) {
  case 'wizard': {
    await runWizard(params.flags);
    break;
  }

  case 'copyLibraries': {
    assert(option, errors['missing-dest-dir-param']);
    const parentDirectory = path.resolve(process.cwd(), option);

    const dirName = await workboxBuild.copyWorkboxLibraries(parentDirectory);
    const fullPath = path.join(parentDirectory, dirName);

    logger.log(`The Workbox libraries were copied to ${fullPath}`);
    logger.log(ol`Add a call to workbox.setConfig({modulePathPrefix: '...'})
        to your service worker to use these local libraries.`);
    logger.log(`See https://goo.gl/Fo9gPX for further documentation.`);
    break;
  }

  case 'generateSW':
  case 'injectManifest': {
    // TODO: Confirm that this works with Windows paths.
    const configPath = path.resolve(process.cwd(),
      option || constants.defaultConfigFile);
    let config;
    try {
      config = readConfig(configPath);
    } catch (error) {
      logger.error(errors['invalid-common-js-module']);
      throw error;
    }

    logger.log(`Using configuration from ${configPath}.`);
    try {
      const {size, count, warnings} = await workboxBuild[command](config);

      for (const warning of warnings) {
        logger.warn(warning);
      }

      logger.log(`The service worker was written to ${config.swDest}\n` +
          `${count} files will be precached, totalling ${prettyBytes(size)}.`);
    } catch (error) {
      // See https://github.com/hapijs/joi/blob/v11.3.4/API.md#errors
      if (typeof error.annotate === 'function') {
        throw new Error(
          `${errors['config-validation-failed']}\n${error.annotate()}`);
      }
      logger.error(errors['workbox-build-runtime-error']);
      throw error;
    }
    break;
  }

  case 'help': {
    params.showHelp();
    break;
  }

  default: {
    throw new Error(errors['unknown-command'] + ` ` + command);
  }
  }
};
