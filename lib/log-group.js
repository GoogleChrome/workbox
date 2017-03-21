/* eslint-disable no-console */

class LogGroup {
  constructor({title, isPrimary}) {
    this._isPrimary = isPrimary || false;
    this._groupTitle = title || '';
    this._logs = [];
    this._childGroups = [];
  }

  addLog(logFunc) {
    this._logs.push(logFunc);
  }

  addChildGroup(group) {
    if (group._logs.length === 0) {
      return;
    }

    this._childGroups.push(group);
  }

  print() {
    let isFirefox = false;
    if (/Firefox\/\d*\.\d*/.exec(navigator.userAgent)) {
      isFirefox = true;
    }

    this._openGroup(isFirefox);

    this._logs.forEach((logDetails) => {
      this._printLogDetails(logDetails);
    });

    this._childGroups.forEach((group) => {
      group.print();
    });

    this._closeGroup(isFirefox);
  }

  _printLogDetails(logDetails) {
    const logFunc = logDetails.logFunc ? logDetails.logFunc : console.log;
    let allArguments = [logDetails.message];
    if (logDetails.colors) {
      allArguments = allArguments.concat(logDetails.colors);
    }
    if (logDetails.args) {
      allArguments = allArguments.concat(logDetails.args);
    }
    logFunc(...allArguments);
  }

  _openGroup(isFirefox) {
    if (this._isPrimary) {
      // Only start a group is there are child groups
      if (this._childGroups.length === 0) {
        return;
      }

      const logDetails = this._logs.splice(0, 1)[0];
      if (isFirefox) {
        // Firefox doesn't support colors lgos in console.group.
        this._printLogDetails(logDetails);
      } else {
        // Print the colored message with console.group
        logDetails.logFunc = console.group;
        this._printLogDetails(logDetails);
      }
    } else {
      console.groupCollapsed(this._groupTitle);
    }
  }

  _closeGroup(isFirefox) {
    // Only close a group if there was a child group opened
    if (this._isPrimary && this._childGroups.length === 0) {
      return;
    }

    if (this._isPrimary && this._childGroups.length === 0 && isFirefox) {
      return;
    }

    console.groupEnd();
  }
}

export default LogGroup;
