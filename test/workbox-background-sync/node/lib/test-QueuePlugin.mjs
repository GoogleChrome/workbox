/*
 Copyright 2017 Google Inc. All Rights Reserved.
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

import {expect} from 'chai';
import sinon from 'sinon';
import {Queue} from
    '../../../../packages/workbox-background-sync/Queue.mjs';
import {QueuePlugin} from
    '../../../../packages/workbox-background-sync/QueuePlugin.mjs';

describe(`[workbox-background-sync] QueuePlugin`, function() {
  const sandbox = sinon.sandbox.create();

  beforeEach(function() {
    Queue._queueNames.clear();
  });

  after(function() {
    Queue._queueNames.clear();
  });

  describe(`constructor`, function() {
    it(`should store a Queue instance`, async function() {
      const queuePlugin = new QueuePlugin('foo');
      expect(queuePlugin._queue).to.be.instanceOf(Queue);
    });

    it(`should implement fetchDidFail and add requests to the queue`,
        async function() {
      sandbox.stub(Queue.prototype, 'addRequest');
      const queuePlugin = new QueuePlugin('foo');

      queuePlugin.fetchDidFail({request: new Request('/')});
      expect(Queue.prototype.addRequest.calledOnce).to.be.true;
      expect(Queue.prototype.addRequest.calledWith(
          sinon.match.instanceOf(Request))).to.be.true;
    });
  });
});
