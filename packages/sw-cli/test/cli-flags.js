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
const CLI = require('../build/cli/index.js');
const cliHelper = require('./helpers/cli-test-helper.js');

require('chai').should();

describe('Test CLI Flags', function() {
  afterEach(function() {
    cliHelper.endLogCapture();
  });

  const versionFlags = [
    '-v',
    '--version',
  ];
  versionFlags.forEach((versionFlag) => {
    it(`should handle version flags: ${versionFlag}`, function() {
      cliHelper.startLogCapture();
      return new CLI().argv([versionFlag])
      .then(() => {
        const captured = cliHelper.endLogCapture();

        captured.exitCode.should.equal(0);

        captured.consoleLogs.length.should.equal(1);

        captured.consoleLogs[0].indexOf(pkg.version).should.not.equal(-1);
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
      cliHelper.startLogCapture();
      return new CLI().argv([helpFlag])
      .then(() => {
        const captured = cliHelper.endLogCapture();

        captured.exitCode.should.equal(0);

        captured.consoleLogs.length.should.equal(1);

        captured.consoleLogs[0].indexOf(helpText).should.not.equal(-1);
      });
    });
  });
});
