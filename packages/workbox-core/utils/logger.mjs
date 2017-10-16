/*
  Copyright 2017 Google Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import LOG_LEVELS from '../models/LogLevels.mjs';
import '../_version.mjs';

const GREY = `#7f8c8d`;
const GREEN = `#2ecc71`;
const YELLOW = `#f39c12`;
const RED = `#c0392b`;
const BLUE = `#3498db`;

let logLevel = (process.env.NODE_ENV === 'production') ?
  LOG_LEVELS.warn : LOG_LEVELS.log;

const shouldPrint = (minLevel) => (logLevel <= minLevel);

const setLoggerLevel = (newLogLevel) => logLevel = newLogLevel;
const getLoggerLevel = () => logLevel;

const _print = function(logFunction, logArgs, minLevel, levelColor) {
  if (!shouldPrint(minLevel)) {
    return;
  }

  const logPrefix = [
    '%cworkbox',
    `background: ${levelColor}; color: white; padding: 2px 0.5em; ` +
      `border-radius: 0.5em;`,
  ];

  logFunction(...logPrefix, ...logArgs);
};

const debug = (...args) => _print(console.debug, args, LOG_LEVELS.debug, GREY);
const log = (...args) => _print(console.log, args, LOG_LEVELS.log, GREEN);
const warn = (...args) => _print(console.warn, args, LOG_LEVELS.warn, YELLOW);
const error = (...args) => _print(console.error, args, LOG_LEVELS.error, RED);

// We always want groups to be logged unless logLevel is silent.
const groupLevel = LOG_LEVELS.error;
const groupCollapsed =
  (...args) => _print(console.groupCollapsed, args, groupLevel, BLUE);
const groupEnd = () => {
  if (shouldPrint(groupLevel)) {
    console.groupEnd();
  }
};
export {setLoggerLevel};
export {getLoggerLevel};
export default {log, debug, warn, error, groupCollapsed, groupEnd};
