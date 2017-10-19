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

const _print = function(logFunction, minLevel, logArgs, levelColor) {
  if (!shouldPrint(minLevel)) {
    return;
  }

  if (!levelColor) {
    logFunction(...logArgs);
    return;
  }

  const logPrefix = [
    '%cworkbox',
    `background: ${levelColor}; color: white; padding: 2px 0.5em; ` +
      `border-radius: 0.5em;`,
  ];

  logFunction(...logPrefix, ...logArgs);
};

// We always want groups to be logged unless logLevel is silent.
const groupLevel = LOG_LEVELS.error;

const groupEnd = () => {
  if (shouldPrint(groupLevel)) {
    console.groupEnd();
  }
};

const defaultExport = {
  groupEnd,
  unprefixed: {
    groupEnd,
  },
};
const configs = {
  debug: {
    func: console.debug,
    level: LOG_LEVELS.debug,
    color: GREY,
  },
  log: {
    func: console.log,
    level: LOG_LEVELS.log,
    color: GREEN,
  },
  warn: {
    func: console.warn,
    level: LOG_LEVELS.warn,
    color: YELLOW,
  },
  error: {
    func: console.error,
    level: LOG_LEVELS.error,
    color: RED,
  },
  groupCollapsed: {
    func: console.groupCollapsed,
    level: groupLevel,
    color: BLUE,
  },
};
Object.keys(configs).forEach((keyName) => {
  const logConfig = configs[keyName];
  defaultExport[keyName] =
    (...args) => _print(logConfig.func, logConfig.level, args, logConfig.color);
  defaultExport.unprefixed[keyName] =
    (...args) => _print(logConfig.func, logConfig.level, args);
});

export {setLoggerLevel};
export {getLoggerLevel};

export default defaultExport;
