/**
 * Copyright 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
**/

'use strict';

const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');
const CLI = require('../src/cli/index.js');

require('chai').should();

describe('Test CLI Flags', function() {
  const originalExit = process.exit;

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  let consoleLogs = [];
  let consoleWarns = [];
  let consoleErrors = [];

  let globalExitCode;

  const startLogCapture = () => {
    console.log = (string) => {
      consoleLogs.push(string);
    };
    console.warn = (string) => {
      consoleWarns.push(string);
    };
    console.error = (string) => {
      consoleErrors.push(string);
    };
  };

  const endLogCapture = () => {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  };

  beforeEach(function() {
    consoleLogs = [];
    consoleWarns = [];
    consoleErrors = [];
    globalExitCode = -1;

    process.exit = (code) => {
      globalExitCode = code;
    };
  });

  afterEach(function() {
    endLogCapture();

    process.exit = originalExit;
  });

  const versionFlags = [
    '-v',
    '--version',
  ];
  versionFlags.forEach((versionFlag) => {
    it(`should handle version flags: ${versionFlag}`, function() {
      startLogCapture();
      return new CLI().argv([versionFlag])
      .then(() => {
        endLogCapture();

        globalExitCode.should.equal(0);

        consoleLogs.length.should.equal(1);

        consoleLogs[0].indexOf(pkg.version).should.not.equal(-1);
      });
    });
  });

  const helpFlags = [
    '-h',
    '--help',
  ];
  const helpText = fs.readFileSync(path.join(__dirname, '..', 'src', 'cli', 'cli-help.txt'), 'utf8');
  helpFlags.forEach((helpFlag) => {
    it(`should handle version flags: ${helpFlag}`, function() {
      startLogCapture();
      return new CLI().argv([helpFlag])
      .then(() => {
        endLogCapture();

        globalExitCode.should.equal(0);

        consoleLogs.length.should.equal(1);

        consoleLogs[0].indexOf(helpText).should.not.equal(-1);
      });
    });
  });
});
