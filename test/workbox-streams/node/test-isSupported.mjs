import {expect} from 'chai';

import {isSupported} from '../../../packages/workbox-streams/isSupported.mjs';

describe(`[workbox-streams] isSupported`, function() {
  const originalSelf = global.self;

  afterEach(function() {
    global.self = originalSelf;
  });

  it(`should return true when ReadableStream is available`, function() {
    global.self = {
      // This could be set to anything.
      ReadableStream: Object.prototype,
    };
    expect(isSupported()).to.be.true;
  });

  it(`should return false when ReadableStream is not available`, function() {
    global.self = {};
    expect(isSupported()).to.be.false;
  });
});
