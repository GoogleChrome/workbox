/* eslint-disable no-console */

const chalk = require('chalk');

/**
 * Log helper is just a wrapper around the console to print slightly
 * nicer / colored messages and could be extended to filter based on log
 * level.
 * @private
 */
class LogHelper {
  /**
   * Print a warning message to the console (Colored yellow).
   * @param {string} msg Message to print to the console
   * @param {Object} [runtimeInfo] Any information available at runtime that
   * should be printed to the console.
   */
  warn(msg, runtimeInfo) {
    let loggedMsg = chalk.yellow(msg);
    if (runtimeInfo) {
      loggedMsg += ` ${runtimeInfo}`;
    }
    console.warn(loggedMsg);
  }

  /**
   * Print an error message to the console (Colored red).
   * @param {string} msg Message to print to the console
   * @param {Error} [err] An optional error to print to the console.
   */
  error(msg, err) {
    console.error(chalk.red(msg));

    if (err && err.stack) {
      console.error(chalk.red(err.stack));
    }
  }

  /**
   * Print an info message to the console (Colored dim).
   * @param {string} msg Message to print to the console
   */
  log(msg) {
    console.log(chalk.dim(msg));
  }
}

module.exports = new LogHelper();
