/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {StorableRequest} from 'workbox-background-sync/lib/StorableRequest.mjs';


describe(`StorableRequest`, function() {
  describe(`static fromRequest`, function() {
    it(`should convert a Request to a StorableRequest instance`, async function() {
      const request = new Request('/foo', {
        method: 'POST',
        body: 'it worked!',
        mode: 'cors',
        headers: {
          'x-foo': 'bar',
          'x-qux': 'baz',
        },
      });

      const storableRequest = await StorableRequest.fromRequest(request);
      expect(storableRequest._requestData.url).to.equal(`${location.origin}/foo`);
      expect(storableRequest._requestData.method).to.equal('POST');
      expect(storableRequest._requestData.body).to.be.instanceOf(ArrayBuffer);
      expect(storableRequest._requestData.body.byteLength).to.equal(10);

      expect(storableRequest._requestData.mode).to.equal('cors');
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
        mode: 'cors',
        headers: {
          'x-foo': 'bar',
          'x-qux': 'baz',
        },
      };

      const storableRequest = new StorableRequest(requestData);
      expect(storableRequest._requestData).to.deep.equal(requestData);
    });

    it(`throws if not given a requestData object`, function() {
      if (process.env.NODE_ENV === 'production') this.skip();

      return expectError(() => {
        new StorableRequest();
      }, 'incorrect-type');
    });

    it(`throws if not given a URL in the requestData object`, function() {
      if (process.env.NODE_ENV === 'production') this.skip();

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
            mode: 'cors',
            headers: {
              'x-foo': 'bar',
              'x-qux': 'baz',
            },
          }));

      const requestData = storableRequest.toObject();

      expect(Object.getPrototypeOf(requestData)).to.equal(Object.prototype);
      expect(requestData.url).to.equal(`${location.origin}/foo`);
      expect(requestData.method).to.equal('POST');
      expect(requestData.body).to.be.instanceOf(ArrayBuffer);
      expect(requestData.body.byteLength).to.equal(10);
      expect(requestData.mode).to.equal('cors');
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
            mode: 'cors',
            headers: {
              'x-foo': 'bar',
              'x-qux': 'baz',
            },
          }));

      const request = storableRequest.toRequest();

      expect(Object.getPrototypeOf(request)).to.equal(Request.prototype);
      expect(request.url).to.equal(`${location.origin}/foo`);
      expect(request.method).to.equal('POST');
      expect(await request.clone().text()).to.equal('it worked!');
      expect(request.mode).to.equal('cors');
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
        mode: 'cors',
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
