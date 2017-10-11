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
import StorableRequest from
    '../../../../packages/workbox-background-sync/lib/StorableRequest.mjs';


describe(`StorableRequest`, function() {
  describe(`static fromRequest`, function() {
    it(`should convert a Request to a StorableRequest instance`, async function() {
      const request = new Request('/foo', {
        method: 'POST',
        body: 'it worked!',
        mode: 'no-cors',
        headers: {
          'x-foo': 'bar',
          'x-qux': 'baz',
        },
      });

      const storableRequest = await StorableRequest.fromRequest(request);

      expect(storableRequest.url).to.equal('/foo');
      expect(storableRequest.requestInit.method).to.equal('POST');
      expect(storableRequest.requestInit.body).to.be.instanceOf(Blob);
      expect(storableRequest.requestInit.body.size).to.equal(10);
      expect(storableRequest.requestInit.mode).to.equal('no-cors');
      expect(storableRequest.requestInit.headers['x-foo']).to.equal('bar');
      expect(storableRequest.requestInit.headers['x-qux']).to.equal('baz');
    });
  });

  describe(`constructor`, function() {
    it(`sets the passed properties on the instance`, function() {
      const url = '/foo';
      const requestInit = {
        method: 'POST',
        body: 'it worked!',
        mode: 'no-cors',
        headers: {
          'x-foo': 'bar',
          'x-qux': 'baz',
        },
      };

      const storableRequest = new StorableRequest({url, requestInit});

      expect(storableRequest.url).to.equal(url);
      expect(storableRequest.requestInit).to.equal(requestInit);
      expect(storableRequest.timestamp).not.to.be.undefined;
    });
  });

  describe(`get timestamp`, function() {
    it(`returns the time when the instance was created`, async function() {
      const clock = sinon.useFakeTimers({now: Date.now()});
      const storableRequest =
          await StorableRequest.fromRequest(new Request('/foo'));

      expect(storableRequest.timestamp).to.equal(Date.now());

      clock.restore();
    });

    it(`uses the passed timestamp if specified`, function() {
      const storableRequest = new StorableRequest({
        url: '/foo',
        requestInit: {},
        timestamp: 1234,
      });

      expect(storableRequest.timestamp).to.equal(1234);
    });
  });

  describe(`toObject`, function() {
    it(`converts the instance to a plain object`, async function() {
      const clock = sinon.useFakeTimers({now: Date.now()});
      const storableRequest = await StorableRequest.fromRequest(
          new Request('/foo', {
        method: 'POST',
        body: 'it worked!',
        mode: 'no-cors',
        headers: {
          'x-foo': 'bar',
          'x-qux': 'baz',
        },
      }));

      const requestObj = storableRequest.toObject();

      expect(Object.getPrototypeOf(requestObj)).to.equal(Object.prototype);
      expect(requestObj.url).to.equal('/foo');
      expect(requestObj.requestInit.method).to.equal('POST');
      expect(requestObj.requestInit.body).to.be.instanceOf(Blob);
      expect(requestObj.requestInit.body.size).to.equal(10);
      expect(requestObj.requestInit.mode).to.equal('no-cors');
      expect(requestObj.requestInit.headers['x-foo']).to.equal('bar');
      expect(requestObj.requestInit.headers['x-qux']).to.equal('baz');
      expect(requestObj.timestamp).to.equal(Date.now());

      clock.restore();
    });
  });

  describe(`toRequest`, function() {
    it(`converts the instance to a Request object`, async function() {
      const storableRequest = await StorableRequest.fromRequest(
          new Request('/foo', {
        method: 'POST',
        body: 'it worked!',
        mode: 'no-cors',
        headers: {
          'x-foo': 'bar',
          'x-qux': 'baz',
        },
      }));

      const request = storableRequest.toRequest();

      expect(Object.getPrototypeOf(request)).to.equal(Request.prototype);
      expect(request.url).to.equal('/foo');
      expect(request.method).to.equal('POST');
      expect(await request.blob()).to.be.instanceOf(Blob);
      expect(request.mode).to.equal('no-cors');
      expect(request.headers.get('x-foo')).to.equal('bar');
      expect(request.headers.get('x-qux')).to.equal('baz');
    });
  });
});
