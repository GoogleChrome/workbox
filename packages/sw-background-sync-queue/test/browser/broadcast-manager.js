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
/* global chai, goog */

'use strict';

describe('broadcast manager test', () => {
	const broadcastManager = goog.backgroundSyncQueue.test.BroadcastManager;

  it('check broadcast', function(done) {
		this.timeout(100);
		let msgRead = false;
    const channelName = 'CHANNEL';
		const testBroadcastChannel = new BroadcastChannel(channelName);
		const testReceiverChannel = new BroadcastChannel(channelName);
		testReceiverChannel.onmessage = function() {
			msgRead = true;
			chai.assert.equal(msgRead, true);
			done();
		};
		broadcastManager.broadcastMessage({
			broadcastChannel: testBroadcastChannel,
			type: 'SUCCESS',
			url: 'http://google.com',
		});
	});
});
