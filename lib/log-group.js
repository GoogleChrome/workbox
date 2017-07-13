/* eslint-disable no-console */

/**
 * A simple helper to manage the print of a set of logs
 */
class LogGroup {
  /**
   * @param {object} input
   */
  constructor() {
    this._logs = [];
    this._childGroups = [];

    this._isFallbackMode = false;
    const ffRegex = /Firefox\/(\d*)\.\d*/.exec(navigator.userAgent);
    if (ffRegex) {
      try {
        const ffVersion = parseInt(ffRegex[1], 10);
        if (ffVersion < 55) {
          this._isFallbackMode = true;
        }
      } catch (err) {
        this._isFallbackMode = true;
      }
    }

    if (/Edge\/\d*\.\d*/.exec(navigator.userAgent)) {
      this._isFallbackMode = true;
    }
  }

  /**
   *@param {object} logDetails
   */
  addPrimaryLog(logDetails) {
    this._primaryLog = logDetails;
  }

  /**
   *@param {object} logDetails
   */
  addLog(logDetails) {
    this._logs.push(logDetails);
  }

  /**
   * @param {object} group
   */
  addChildGroup(group) {
    if (group._logs.length === 0) {
      return;
    }

    this._childGroups.push(group);
  }

  /**
   * prints out this log group to the console.
   */
  print() {
    if (this._logs.length === 0 && this._childGroups.length === 0) {
      this._printLogDetails(this._primaryLog);
      return;
    }

    if (this._primaryLog) {
      if (!this._isFallbackMode) {
        console.groupCollapsed(...this._getLogContent(this._primaryLog));
      } else {
        this._printLogDetails(this._primaryLog);
      }
    }

    this._logs.forEach((logDetails) => {
      this._printLogDetails(logDetails);
    });

    this._childGroups.forEach((group) => {
      group.print();
    });

    if (this._primaryLog && !this._isFallbackMode) {
      console.groupEnd();
    }
  }

  /**
   * Prints the specific logDetails object.
   * @param {object} logDetails
   */
  _printLogDetails(logDetails) {
    const logFunc = logDetails.logFunc ? logDetails.logFunc : console.log;
    logFunc(...this._getLogContent(logDetails));
  }

  /**
   * Returns a flattened array of message with colors and args.
   * @param {object} logDetails
   * @return {Array} Returns an array of arguments to pass to a console
   * function.
   */
  _getLogContent(logDetails) {
    let message = logDetails.message;
    if (this._isFallbackMode && typeof message === 'string') {
      // Replace the %c value with an empty string.
      message = message.replace(/%c/g, '');
    }

    let allArguments = [message];

    if (!this._isFallbackMode && logDetails.colors) {
      allArguments = allArguments.concat(logDetails.colors);
    }

    if (logDetails.args) {
      allArguments = allArguments.concat(logDetails.args);
    }
    return allArguments;
  }
}

export default LogGroup;
