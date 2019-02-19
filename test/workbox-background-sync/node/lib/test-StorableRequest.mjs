/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import expectError from '../../../../infra/testing/expectError';
import {devOnly} from '../../../../infra/testing/env-it';
import StorableRequest from
  '../../../../packages/workbox-background-sync/models/StorableRequest.mjs';


describe(`[workbox-background-sync] StorableRequest`, function() {
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

      expect(storableRequest._requestData.url).to.equal('/foo');
      expect(storableRequest._requestData.method).to.equal('POST');
      expect(storableRequest._requestData.body).to.be.instanceOf(Blob);
      expect(storableRequest._requestData.body.size).to.equal(10);
      expect(storableRequest._requestData.mode).to.equal('no-cors');
      expect(storableRequest._requestData.headers['x-foo']).to.equal('bar');
      expect(storableRequest._requestData.headers['x-qux']).to.equal('baz');
    });
  });

  describe(`constructor`, function() {
    it(`sets the passed properties on the instance`, function() {
      const requestData = {
        url: '/foo',
        method: 'POST',
        body: 'it worked!',
        mode: 'no-cors',
        headers: {
          'x-foo': 'bar',
          'x-qux': 'baz',
        },
      };

      const storableRequest = new StorableRequest(requestData);
      expect(storableRequest._requestData).to.deep.equal(requestData);
    });

    devOnly.it(`throws if not given a requestData object`, function() {
      return expectError(() => {
        new StorableRequest();
      }, 'incorrect-type');
    });

    devOnly.it(`throws if not given a URL in the requestData object`, function() {
      return expectError(() => {
        new StorableRequest({});
      }, 'incorrect-type');
    });
  });

  describe(`toObject`, function() {
    it(`converts the instance to a plain object`, async function() {
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

      const requestData = storableRequest.toObject();

      expect(Object.getPrototypeOf(requestData)).to.equal(Object.prototype);
      expect(requestData.url).to.equal('/foo');
      expect(requestData.method).to.equal('POST');
      expect(requestData.body).to.be.instanceOf(Blob);
      expect(requestData.body.size).to.equal(10);
      expect(requestData.mode).to.equal('no-cors');
      expect(requestData.headers['x-foo']).to.equal('bar');
      expect(requestData.headers['x-qux']).to.equal('baz');
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

  describe(`clone`, function() {
    it(`creates a new instance with the same values`, async function() {
      const original = new StorableRequest({
        url: '/foo',
        body: new Blob(['it worked!']),
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'x-foo': 'bar',
          'x-qux': 'baz',
        },
      });
      const clone = original.clone();

      expect(original._requestData).to.deep.equal(clone._requestData);

      // Ensure clone was not shallow.
      expect(original._requestData.body).to.not.equal(clone._requestData.body);
      expect(original._requestData.headers).to.not.equal(
          clone._requestData.headers);
    });
  });
});
