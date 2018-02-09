/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

/* eslint-env mocha, browser */

import BroadcastCacheUpdate from '../../src/lib/broadcast-cache-update.js';

describe(`Test of the BroadcastCacheUpdate class`, function() {
  const channelName = 'test-channel';
  const headersToCheck = ['one', 'two'];
  const source = 'test-source';

  it(`should throw when BroadcastCacheUpdate() is called without any parameters`, function() {
    expect(() => {
      new BroadcastCacheUpdate();
    }).to.throw().with.property('name', 'channel-name-required');
  });

  it(`should use the channelName from the constructor`, function() {
    const bcu = new BroadcastCacheUpdate({channelName});
    expect(bcu.channelName).to.equal(channelName);
  });

  it(`should use the headersToCheck from the constructor`, function() {
    const bcu = new BroadcastCacheUpdate({channelName, headersToCheck});
    expect(bcu.headersToCheck).to.equal(headersToCheck);
  });

  it(`should use a default value for headersToCheck when one isn't provided`, function() {
    const bcu = new BroadcastCacheUpdate({channelName});
    expect(bcu.headersToCheck).to.not.be.empty;
  });

  it(`should use the source from the constructor`, function() {
    const bcu = new BroadcastCacheUpdate({channelName, source});
    expect(bcu.source).to.equal(source);
  });

  it(`should use a default value for source when one isn't provided`, function() {
    const bcu = new BroadcastCacheUpdate({channelName});
    expect(bcu.source).to.not.be.empty;
  });

  if ('BroadcastChannel' in self) {
    it(`should create and reuse a BroadcastChannel based on channelName`, function() {
      const bcu = new BroadcastCacheUpdate({channelName});
      const broadcastChannel = bcu.channel;
      expect(broadcastChannel).to.be.instanceof(BroadcastChannel);
      // bcu.channel is a getter that create a BroadcastChannel the first
      // time it's called, and this test confirms that it returns the same
      // BroadcastChannel object when called twice.
      expect(broadcastChannel).to.eql(bcu.channel);
      expect(broadcastChannel.name).to.equal(channelName);
    });
  }
});
