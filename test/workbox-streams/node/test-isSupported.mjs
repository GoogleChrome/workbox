/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import clearRequire from 'clear-require';

describe(`[workbox-streams] isSupported`, function() {
  const originalReadableStream = global.ReadableStream;
  const MODULE_ID = '../../../packages/workbox-streams/isSupported.mjs';

  afterEach(function() {
    global.ReadableStream = originalReadableStream;
    clearRequire(MODULE_ID);
  });

  it(`should return true when ReadableStream is available`, async function() {
    class ReadableStream {
      constructor() {
        // no-op
      }
    }
    global.ReadableStream = ReadableStream;

    const {isSupported} = await import(MODULE_ID);
    expect(isSupported()).to.be.true;
  });

  it(`should return false when ReadableStream is not available`, async function() {
    global.ReadableStream = undefined;

    const {isSupported} = await import(MODULE_ID);
    expect(isSupported()).to.be.false;
  });

  it(`should return false when ReadableStream throws during construction`, async function() {
    class ReadableStream {
      constructor() {
        throw new Error();
      }
    }
    global.ReadableStream = ReadableStream;

    const {isSupported} = await import(MODULE_ID);
    expect(isSupported()).to.be.false;
  });
});
