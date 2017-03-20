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

self.goog = self.goog || {};
self.goog.LOG_LEVEL = self.goog.LOG_LEVEL || {
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

/**
 * A class that will only log given the current log level
 * defined by the developer.
 *
 * Define custom log level by setting `self.goog.logLevel`.
 *
 * @example
 *
 * self.goog.logLevel = self.goog.LOG_LEVEL.verbose;
 *
 * @private
 */
class LogHelper {
  /**
   * LogHelper constructor.
   */
  constructor() {
    this._isFirefox = false;
    if (/Firefox\/\d*\.\d*/.exec(navigator.userAgent)) {
      this._isFirefox = true;
    }

    this._defaultLogLevel = location.hostname === 'localhost' ?
      self.goog.LOG_LEVEL.debug : self.goog.LOG_LEVEL.none;
  }

  /**
   * The most verbose log level.
   *
   * @param {Object} options The options of the log.
   */
  info(options) {
    this._printMessage(self.goog.LOG_LEVEL.verbose, console.log, options);
  }

  /**
   * Useful for logs that are more exceptional that log()
   * but not severe.
   *
   * @param {Object} options The options of the log.
   */
  debug(options) {
    this._printMessage(self.goog.LOG_LEVEL.debug, console.debug, options);
  }

  /**
   * Warning messages.
   *
   * @param {Object} options The options of the log.
   */
  warn(options) {
    this._printMessage(self.goog.LOG_LEVEL.warn, console.warn, options);
  }

  /**
   * Error logs.
   *
   * @param {Object} options The options of the log.
   */
  error(options) {
    this._printMessage(self.goog.LOG_LEVEL.error, console.error, options);
  }

  /**
   * Method to print to the console.
   * @param {number} logLevel
   * @param {function} logMethod
   * @param {Object} logOptions
   */
  _printMessage(logLevel, logMethod, logOptions) {
    if (!logOptions) {
      return;
    }

    if (!this._shouldLogMessage(logLevel)) {
      return;
    }

    // If the options is a string - print it and return as there is nothing
    // else to be done.
    const topLevelLogArgs = this._getTopLevelLogArgs(logLevel, logOptions);
    if (typeof logOptions === 'string') {
      console.log('ITs a STRING <------');
      logMethod(...topLevelLogArgs);
      return;
    } else {
      console.log('NOPE');
    }

    this._openGroup(logMethod, topLevelLogArgs);

    if (logOptions.that && logOptions.that.constructor &&
      logOptions.that.constructor.name) {
      const className = logOptions.that.constructor.name;
      logMethod(`%cclassName:%c ${className}`,
        `color: ${LIGHT_GREY}`, `color: black`);
    }

    if (logOptions.data) {
      if (typeof logOptions.data === 'object' &&
        !(logOptions.data instanceof Array)) {
        Object.keys(logOptions.data).forEach((keyName) => {
          logMethod(`%c${keyName}: `, `color: ${LIGHT_GREY}`,
            logOptions.data[keyName]);
        });
      } else {
        logMethod(`%cadditionalData`, `color: ${LIGHT_GREY}`, logOptions.data);
      }
    }

    console.groupEnd();

    console.groupEnd();
  }

  _getTopLevelLogArgs(logLevel, logOptions) {
    let logLevelName;
    let logLevelColor;
    switch (logLevel) {
      case self.goog.LOG_LEVEL.verbose:
        logLevelName = 'Info';
        logLevelColor = LIGHT_GREY;
        break;
      case self.goog.LOG_LEVEL.debug:
        logLevelName = 'Debug';
        logLevelColor = LIGHT_GREEN;
        break;
      case self.goog.LOG_LEVEL.warn:
        logLevelName = 'Warn';
        logLevelColor = LIGHT_YELLOW;
        break;
      case self.goog.LOG_LEVEL.error:
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
    if(typeof logOptions === 'string') {
      message = logOptions;
    } else if (logOptions.message) {
      message = logOptions.message;
    }

    if (message) {
      primaryLogMessage += `%c ${message}`;
      primaryLogColors.push(`color: ${DARK_GREY}; font-weight: normal`);
    }

    return [primaryLogMessage, ...primaryLogColors];
  }

  _shouldLogMessage(logLevel) {
    let currentLogLevel = this._defaultLogLevel;
    if (self && self.goog && typeof self.goog.logLevel === 'number') {
      currentLogLevel = self.goog.logLevel;
    }

    if (currentLogLevel === self.goog.LOG_LEVEL.none ||
      logLevel < currentLogLevel) {
      return false;
    }

    return true;
  }

  _openGroup(logMethod, logArgs) {
    // Firefox doesn't support coloring in the group title :(
    if (this._isFirefox) {
      logMethod(...logArgs);
      console.groupCollapsed('Additional Details');
    } else {
      console.groupCollapsed(...logArgs);
    }
  }
}

self.goog.temp = new LogHelper();

export default self.goog.temp;
