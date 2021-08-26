/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;
const upath = require('upath');

const {
  cleanupStackTrace,
} = require('../../../../packages/workbox-cli/build/lib/cleanup-stack-trace');

describe(`[workbox-cli] lib/cleanup-stack-trace.js`, function () {
  const CURRENT_MODULE_NAME = upath.basename(__filename);

  it(`should return an empty string when passed an error with no stack`, function () {
    const error = new Error();
    error.stack = '';
    expect(cleanupStackTrace(error, CURRENT_MODULE_NAME)).to.eql('');
  });

  it(`should exclude every stack frame prior to the first frame of ${CURRENT_MODULE_NAME}`, function () {
    const error = new Error();
    const cleanStackTrace = cleanupStackTrace(error, CURRENT_MODULE_NAME);
    const frameCount = cleanStackTrace.split(`\n`).length;
    expect(frameCount).to.eql(1);
  });

  it(`should exclude every stack frame prior to the first frame of ${CURRENT_MODULE_NAME}, when the error is nested`, function () {
    let error;
    (() => {
      error = new Error();
    })();
    const cleanStackTrace = cleanupStackTrace(error, CURRENT_MODULE_NAME);
    const frameCount = cleanStackTrace.split(`\n`).length;
    expect(frameCount).to.eql(2);
  });

  it(`should exclude error.message, and just return the stack frames`, function () {
    const error = new Error(`line 1\nline 2\nline 3`);
    const cleanStackTrace = cleanupStackTrace(error, CURRENT_MODULE_NAME);
    const frameCount = cleanStackTrace.split(`\n`).length;
    expect(frameCount).to.eql(1);
  });
});
