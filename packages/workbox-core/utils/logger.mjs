import core from '../index.mjs';
import LOG_LEVELS from '../models/LogLevels.mjs';

const GREY = `#7f8c8d`;
const GREEN = `#2ecc71`;
const YELLOW = `#f39c12`;
const RED = `#c0392b`;
const BLUE = `#3498db`;

const _print = function(logFunction, logArgs, minLevel, levelColor) {
  if (core.logLevel > minLevel) {
    return;
  }

  const initLogOutput = [
    '%cworkbox',
    `
      background: ${levelColor};
      color: white;
      padding: 2px 0.5em;
      border-radius: 0.5em;
    `,
  ];

  logFunction(...initLogOutput, ...logArgs);
};

const log = (...args) => _print(console.log, args, LOG_LEVELS.verbose, GREY);
const debug = (...args) => _print(console.debug, args, LOG_LEVELS.debug, GREEN);
const warn = (...args) => _print(console.warn, args, LOG_LEVELS.warn, YELLOW);
const error = (...args) => _print(console.error, args, LOG_LEVELS.error, RED);
const groupCollapsed =
  (...args) => _print(console.groupCollapsed, args, LOG_LEVELS.error, BLUE);
const groupEnd = console.groupEnd;

export default {log, debug, warn, error, groupCollapsed, groupEnd};
