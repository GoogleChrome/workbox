/**
 * LogHelper should be used to print to the console.
 *
 * This class will allow Workbox to log in a consistent style and
 * take advantage of console coloring and groups.
 */
export default class LogHelper {
  /**
   * Initialises the log level based on the current origin.
   */
  constructor() {
    // TODO: Set initial log level based on localhost
    this._logLevel = this.LOG_LEVELS.verbose;
  }

  /**
   * Allows access to the log levels.
   * @return {Object} An object containing the available log levels.
   */
  get LOG_LEVELS() {
    return {
      verbose: 0,
      debug: 1,
      warning: 2,
      error: 3,
    };
  }

  /**
   * A setter for the logLevel allowing the developer to define
   * which messages should be printed to the console.
   * @param {number} newLevel the new logLevel to use.
   */
  set logLevel(newLevel) {
    // TODO: Assert newLevel is a number
    if (typeof newLevel !== 'number') {
      throw new Error('newLevel must be a number');
    }

    if (newLevel > this.LOG_LEVELS.error ||
      newLevel < this.LOG_LEVELS.verbose) {
      // TODO: Throw workbox error + error code.
      throw new Error(`Invalid new level`);
    }

    this._logLevel = newLevel;
  }

  /**
   * If the current logLevel allows this log, it'll
   * be printed to the console with the supplied function.
   * @param {Function} logFunction
   * @param {*} logArgs
   * @param {number} minLevel
   */
  _print(logFunction, logArgs, minLevel) {
    if (this._logLevel > minLevel) {
      return;
    }

    logFunction(...logArgs);
  }

  /**
   * Prints to `console.log`
   */
  log(...args) {
    this._print(console.log, args, this.LOG_LEVELS.verbose);
  }

  /**
   * Prints to `console.debug`
   */
  debug(...args) {
    this._print(console.debug, args, this.LOG_LEVELS.debug);
  }

  /**
   * Prints to `console.warn`
   */
  warn(...args) {
    this._print(console.warn, args, this.LOG_LEVELS.warning);
  }

  /**
   * Prints to `console.error`
   */
  error(...args) {
    this._print(console.error, args, this.LOG_LEVELS.error);
  }
}
