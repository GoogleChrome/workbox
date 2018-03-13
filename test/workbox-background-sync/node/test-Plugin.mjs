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
import {reset as iDBReset} from 'shelving-mock-indexeddb';
import sinon from 'sinon';
import {Queue} from '../../../packages/workbox-background-sync/Queue.mjs';
import {Plugin} from '../../../packages/workbox-background-sync/Plugin.mjs';

describe(`[workbox-background-sync] Plugin`, function() {
  const sandbox = sinon.sandbox.create();

  const reset = () => {
    sandbox.restore();
    Queue._queueNames.clear();
    iDBReset();
  };

  beforeEach(async function() {
    reset();
  });

  after(async function() {
    reset();
  });

  describe(`constructor`, function() {
    it(`should store a Queue instance`, async function() {
      const queuePlugin = new Plugin('foo');
      expect(queuePlugin._queue).to.be.instanceOf(Queue);
    });

    it(`should implement fetchDidFail and add requests to the queue`,
        async function() {
      sandbox.stub(Queue.prototype, 'addRequest');
      const queuePlugin = new Plugin('foo');

      queuePlugin.fetchDidFail({request: new Request('/')});
      expect(Queue.prototype.addRequest.calledOnce).to.be.true;
      expect(Queue.prototype.addRequest.calledWith(
          sinon.match.instanceOf(Request))).to.be.true;
    });
  });
});
