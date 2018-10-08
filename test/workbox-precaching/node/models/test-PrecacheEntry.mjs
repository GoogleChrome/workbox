/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import sinon from 'sinon';

import PrecacheEntry from '../../../../packages/workbox-precaching/models/PrecacheEntry.mjs';

describe('[workbox-precaching] PrecacheEntry', function() {
  const sandbox = sinon.createSandbox();

  afterEach(function() {
    sandbox.restore();
  });

  describe('constructor', function() {
    it(`should use search param if 'cache' option is not supported`, async function() {
      const entry = new PrecacheEntry('example', '/url', '1234', true);
      expect(entry._networkRequest.url).to.equal(new URL('/url?_workbox-cache-bust=1234', self.location).toString());
    });

    it(`should use search param if 'cache' option is not supported and keep previous search params`, async function() {
      const entry = new PrecacheEntry('example', '/url?foo=bar', '1234', true);
      expect(entry._networkRequest.url).to.equal(new URL('/url?foo=bar&_workbox-cache-bust=1234', self.location).toString());
    });

    it(`should use 'cache' option if supported`, async function() {
      // Sinon has poor ES2015 class / constructor spying
      // so had to fake the Request object completely.
      class FakeRequest {
        constructor(url, options) {
          this.url = url;
          this.options = options;
        }

        get cache() {
          return this.options.cache || 'default';
        }
      }
      sinon.stub(global, 'Request').value(FakeRequest);

      const entry = new PrecacheEntry('example', '/url', '1234', true);
      expect(entry._networkRequest.url).to.equal(`/url`);
      expect(entry._networkRequest.cache).to.equal(`reload`);
    });
  });
});
