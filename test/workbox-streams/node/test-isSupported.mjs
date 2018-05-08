import {expect} from 'chai';

import {isSupported} from '../../../packages/workbox-streams/isSupported.mjs';

describe(`[workbox-streams] isSupported`, function() {
  const originalReadableStream = global.ReadableStream;

  afterEach(function() {
    global.ReadableStream = originalReadableStream;
  });

  it(`should return true when ReadableStream is available`, function() {
    class ReadableStream {
      constructor() {
        // no-op
      }
    }
    global.ReadableStream = ReadableStream;
    expect(isSupported()).to.be.true;
  });

  it(`should return false when ReadableStream is not available`, function() {
    global.ReadableStream = undefined;
    expect(isSupported()).to.be.false;
  });

  it(`should return false when ReadableStream throws during construction`, function() {
    class ReadableStream {
      constructor() {
        throw new Error();
      }
    }
    global.ReadableStream = ReadableStream;
    expect(isSupported()).to.be.false;
  });
});
