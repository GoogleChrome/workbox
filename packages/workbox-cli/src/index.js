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

const fs = require('fs');
const path = require('path');
const updateNotifier = require('update-notifier');
const swBuild = require('workbox-build');

const cliLogHelper = require('./lib/log-helper');
const generateGlobPattern = require('./lib/utils/generate-glob-pattern');
const saveConfigFile = require('./lib/utils/save-config');
const getConfigFile = require('./lib/utils/get-config');
const errors = require('./lib/errors');

const askForRootOfWebApp = require('./lib/questions/ask-root-of-web-app');
const askForServiceWorkerName = require('./lib/questions/ask-sw-name');
const askSaveConfigFile = require('./lib/questions/ask-save-config');
const askForExtensionsToCache =
  require('./lib/questions/ask-extensions-to-cache');

/**
 * This class is a wrapper to make test easier. This is used by
 * ./bin/index.js to pass in the args when the CLI is used.
 */
class SWCli {
  /**
   * This is a helper method that allows the test framework to call argv with
   * arguments without worrying about running as an actual CLI.
   *
   * @private
   * @param {Object} meowOutput The value passed in via process.argv.
   * @return {Promise} Promise is returned so testing framework knows when
   * handling the request has finished.
   */
  argv(meowOutput) {
    updateNotifier({pkg: meowOutput.pkg}).notify();

    if (meowOutput.input.length > 0) {
      // We have a command
      return this.handleCommand(
        meowOutput.input[0],
        meowOutput.input.splice(1),
        meowOutput.flags
      )
      .then(() => {
        process.exit(0);
      })
      .catch(() => {
        process.exit(1);
      });
    } else {
      meowOutput.showHelp(1);
    }
  }

  /**
   * Prints the help text to the terminal.
   * @return {string} The log output
   */
  getHelpText() {
    return fs.readFileSync(
      path.join(__dirname, 'cli-help.txt'), 'utf8');
  }

  /**
   * If a command is given in the command line args, this method will handle
   * the appropriate action.
   * @param {string} command The command name.
   * @param {object} args The arguments given to this command.
   * @param {object} flags The flags supplied with the command line.
   * @return {Promise} A promise for the provided task.
   */
  handleCommand(command, args, flags) {
    switch (command) {
      case 'generate:sw':
        return this._generateSW(flags);
      default:
        cliLogHelper.error(`Invalid command given '${command}'`);
        return Promise.reject();
    }
  }

  /**
   * This method will generate a working service worker with a file manifest.
   * @param {Object} flags The flags supplied as part of the CLI input.
   * @return {Promise} The promise returned here will be used to exit the
   * node process cleanly or not.
   */
  _generateSW(flags) {
    let config = {};

    return getConfigFile()
    .then((savedConfig) => {
      if (savedConfig) {
        config = savedConfig;
      }
      config = Object.assign(config, flags);
    })
    .then(() => {
      const requiredFields = [
        'globDirectory',
        'staticFileGlobs',
        'swDest',
      ];

      let askQuestions = false;
      requiredFields.forEach((requiredField) => {
        if (!config[requiredField]) {
          askQuestions = true;
        }
      });

      if (askQuestions) {
        // If some configuration is defined but not all required fields
        // throw an error forcing the developer to either go through
        // the guided flow OR go through the config only flow.
        if (Object.keys(config).length > 0) {
          cliLogHelper.error(errors['config-supplied-missing-fields']);
          return Promise.reject();
        }

        return this._askGenerateQuestions(config);
      }

      return Promise.resolve(config);
    })
    .then((config) => {
      return swBuild.generateSW(config);
    });
  }

  /**
   * Ask questions required for input.
   * @param  {object} config The config options.
   * @return {Promise<object>} Promise resolves to the config object.
   */
  _askGenerateQuestions(config) {
    return Promise.resolve()
    .then(() => {
      if (!config.globDirectory) {
        return askForRootOfWebApp()
        .then((rDirectory) => {
          // This will give a pretty relative path:
          // '' => './'
          // 'build' => './build/'
          config.globDirectory =
            path.join('.', path.relative(process.cwd(), rDirectory), path.sep);
        });
      }
    })
    .then(() => {
      if (!config.staticFileGlobs) {
        return askForExtensionsToCache(config.globDirectory)
        .then((extensionsToCache) => {
          config.staticFileGlobs = [
            generateGlobPattern(extensionsToCache),
          ];
        });
      }
    })
    .then(() => {
      if (!config.swDest) {
        return askForServiceWorkerName()
        .then((swName) => {
          config.swDest = path.join(config.globDirectory, swName);
          config.globIgnores = [
            swName,
          ];
        });
      }
    })
    .then(() => {
      return askSaveConfigFile();
    })
    .then((saveConfig) => {
      if (saveConfig) {
        return saveConfigFile(config);
      }
    })
    .then(() => config);
  }
}

module.exports = SWCli;
