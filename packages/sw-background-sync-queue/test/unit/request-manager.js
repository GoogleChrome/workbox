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

describe('request-manager test', () => {
	let responseCounter = 0;
	const callbacks = {
		onResponse: function() {
			responseCounter++;
		},
	};
	const queue = new new goog.backgroundSyncQueue.test.RequestQueue();
	const reqManager = new goog.backgroundSyncQueue.test.RequestManager({
		callbacks,
		queue,
	});
  it('check instances', () => {
		chai.assert.isObject(reqManager);
  });
});
