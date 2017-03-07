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
    this._allowedLogLevel = location.hostname === 'localhost' ?
      self.goog.LOG_LEVEL.debug : self.goog.LOG_LEVEL.none;
  }
  /**
   * The most verbose log level.
   */
  log(...args) {
    this._printMessage(self.goog.LOG_LEVEL.verbose, console.log, args);
  }

  /**
   * Useful for logs that are more exceptional that log()
   * but not severe.
   */
  debug(...args) {
    this._printMessage(self.goog.LOG_LEVEL.debug, console.debug, args);
  }

  /**
   * Warning messages.
   */
  warn(...args) {
    this._printMessage(self.goog.LOG_LEVEL.warn, console.warn, args);
  }

  /**
   * Error logs.
   */
  error(...args) {
    this._printMessage(self.goog.LOG_LEVEL.error, console.error, args);
  }

  /**
   * Method to print to the console.
   * @param {number} logLevel
   * @param {function} logMethod
   * @param {Object} logArguments
   */
  _printMessage(logLevel, logMethod, logArguments) {
    let currentLogLevel = this._allowedLogLevel;

    if (self && self.goog && self.goog.logLevel) {
      currentLogLevel = self.goog.logLevel;
    }

    if (currentLogLevel === self.goog.LOG_LEVEL.none ||
      logLevel < currentLogLevel) {
      return;
    }

    logMethod(...logArguments);
  }
}

export default new LogHelper();
