const originalExit = process.exit;

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

let consoleLogs = [];
let consoleWarns = [];
let consoleErrors = [];

let exitCode;

const resetValues = () => {
  consoleLogs = [];
  consoleWarns = [];
  consoleErrors = [];
  exitCode = -1;
};

const startLogCapture = () => {
  resetValues();

  console.log = (string) => {
    consoleLogs.push(string);
  };
  console.warn = (string) => {
    consoleWarns.push(string);
  };
  console.error = (string) => {
    consoleErrors.push(string);
  };

  process.exit = (code) => {
    exitCode = code;
  };
};

const endLogCapture = () => {
  console.log = originalLog;
  console.warn = originalWarn;
  console.error = originalError;

  process.exit = originalExit;

  const captured = {
    consoleLogs,
    consoleWarns,
    consoleErrors,
    exitCode,
  };

  resetValues();

  return captured;
};

module.exports = {
  startLogCapture,
  endLogCapture,
};
