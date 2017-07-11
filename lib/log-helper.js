/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

/* eslint-disable no-console */

import LogGroup from './log-group';
import {isDevBuild} from './environment';

self.workbox = self.workbox || {};
self.workbox.LOG_LEVEL = self.workbox.LOG_LEVEL || {
  none: -1,
  verbose: 0,
  debug: 1,
  warn: 2,
  error: 3,
};

const LIGHT_GREY = `#bdc3c7`;
const DARK_GREY = `#7f8c8d`;
const LIGHT_GREEN = `#2ecc71`;
const LIGHT_YELLOW = `#f1c40f`;
const LIGHT_RED = `#e74c3c`;
const LIGHT_BLUE = `#3498db`;

/**
 * A class that will only log given the current log level
 * defined by the developer.
 *
 * Define custom log level by setting `self.workbox.logLevel`.
 *
 * @example
 *
 * self.workbox.logLevel = self.workbox.LOG_LEVEL.verbose;
 *
 * @private
 */
class LogHelper {
  /**
   * LogHelper constructor.
   */
  constructor() {
    this._defaultLogLevel = isDevBuild() ?
      self.workbox.LOG_LEVEL.debug :
      self.workbox.LOG_LEVEL.warn;
  }

  /**
   * The most verbose log level.
   *
   * @param {Object} options The options of the log.
   */
  log(options) {
    this._printMessage(self.workbox.LOG_LEVEL.verbose, options);
  }

  /**
   * Useful for logs that are more exceptional that log()
   * but not severe.
   *
   * @param {Object} options The options of the log.
   */
  debug(options) {
    this._printMessage(self.workbox.LOG_LEVEL.debug, options);
  }

  /**
   * Warning messages.
   *
   * @param {Object} options The options of the log.
   */
  warn(options) {
    this._printMessage(self.workbox.LOG_LEVEL.warn, options);
  }

  /**
   * Error logs.
   *
   * @param {Object} options The options of the log.
   */
  error(options) {
    this._printMessage(self.workbox.LOG_LEVEL.error, options);
  }

  /**
   * Method to print to the console.
   * @param {number} logLevel
   * @param {Object} logOptions
   */
  _printMessage(logLevel, logOptions) {
    if (!this._shouldLogMessage(logLevel, logOptions)) {
      return;
    }

    const logGroups = this._getAllLogGroups(logLevel, logOptions);
    logGroups.print();
  }

  /**
   * Print a user friendly log to the console.
   * @param  {numer} logLevel A number from self.workbox.LOG_LEVEL
   * @param  {Object} logOptions Arguments to print to the console
   * @return {LogGroup} Returns a log group to print to the console.
   */
  _getAllLogGroups(logLevel, logOptions) {
    const topLogGroup = new LogGroup();

    const primaryMessage = this._getPrimaryMessageDetails(logLevel, logOptions);
    topLogGroup.addPrimaryLog(primaryMessage);

    if (logOptions.error) {
      const errorMessage = {
        message: logOptions.error,
        logFunc: console.error,
      };
      topLogGroup.addLog(errorMessage);
    }

    const extraInfoGroup = new LogGroup();
    if (logOptions.that && logOptions.that.constructor &&
      logOptions.that.constructor.name) {
      const className = logOptions.that.constructor.name;
      extraInfoGroup.addLog(
        this._getKeyValueDetails('class', className)
      );
    }

    if (logOptions.data) {
      if (typeof logOptions.data === 'object' &&
        !(logOptions.data instanceof Array)) {
        Object.keys(logOptions.data).forEach((keyName) => {
          extraInfoGroup.addLog(
            this._getKeyValueDetails(keyName, logOptions.data[keyName])
          );
        });
      } else {
        extraInfoGroup.addLog(
          this._getKeyValueDetails('additionalData', logOptions.data)
        );
      }
    }

    topLogGroup.addChildGroup(extraInfoGroup);

    return topLogGroup;
  }

  /**
   * This is a helper function to wrap key value pairss to a colored key
   * value string.
   * @param  {string} key
   * @param  {string} value
   * @return {Object} The object containing a message, color and Arguments
   * for the console.
   */
  _getKeyValueDetails(key, value) {
    return {
      message: `%c${key}: `,
      colors: [`color: ${LIGHT_BLUE}`],
      args: value,
    };
  }

  /**
   * Helper method to color the primary message for the log
   * @param  {number} logLevel   One of self.workbox.LOG_LEVEL
   * @param  {Object} logOptions Arguments to print to the console
   * @return {Object} Object containing the message and color info to print.
   */
  _getPrimaryMessageDetails(logLevel, logOptions) {
    let logLevelName;
    let logLevelColor;
    switch (logLevel) {
      case self.workbox.LOG_LEVEL.verbose:
        logLevelName = 'Info';
        logLevelColor = LIGHT_GREY;
        break;
      case self.workbox.LOG_LEVEL.debug:
        logLevelName = 'Debug';
        logLevelColor = LIGHT_GREEN;
        break;
      case self.workbox.LOG_LEVEL.warn:
        logLevelName = 'Warn';
        logLevelColor = LIGHT_YELLOW;
        break;
      case self.workbox.LOG_LEVEL.error:
        logLevelName = 'Error';
        logLevelColor = LIGHT_RED;
        break;
    }

    let primaryLogMessage = `%c🔧 %c[${logLevelName}]`;
    const primaryLogColors = [
      `color: ${LIGHT_GREY}`,
      `color: ${logLevelColor}`,
    ];

    let message;
    if (typeof logOptions === 'string') {
      message = logOptions;
    } else if (logOptions.message) {
      message = logOptions.message;
    }

    if (message) {
      message = message.replace(/\s+/g, ' ');
      primaryLogMessage += `%c ${message}`;
      primaryLogColors.push(`color: ${DARK_GREY}; font-weight: normal`);
    }

    return {
      message: primaryLogMessage,
      colors: primaryLogColors,
    };
  }

  /**
   * Test if the message should actually be logged.
   * @param {number} logLevel The level of the current log to be printed.
   * @param {Object|String} logOptions The options to log.
   * @return {boolean} Returns true of the message should be printed.
   */
  _shouldLogMessage(logLevel, logOptions) {
    if (!logOptions) {
      return false;
    }

    let minValidLogLevel = this._defaultLogLevel;
    if (self && self.workbox && typeof self.workbox.logLevel === 'number') {
      minValidLogLevel = self.workbox.logLevel;
    }

    if (minValidLogLevel === self.workbox.LOG_LEVEL.none ||
      logLevel < minValidLogLevel) {
      return false;
    }

    return true;
  }
}

export default new LogHelper();
