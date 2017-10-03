import {expect} from 'chai';
import sinon from 'sinon';

import '../../../../infra/utils/mock-fetch';

import PrecacheEntry from '../../../../packages/workbox-precaching/models/PrecacheEntry.mjs';

describe('[workbox-precaching] PrecacheEntry', function() {
  const sandbox = sinon.sandbox.create();

  afterEach(function() {
    sandbox.restore();
  });

  describe('constructor', function() {
    it(`should use search param if 'cache' option is not supported`, async function() {
      const entry = new PrecacheEntry('example', '/url', '1234', true);
      expect(entry._networkRequest.url).to.equal(`${self.location}/url?_workbox-precaching=1234`);
    });

    it(`should use search param if 'cache' option is not supported and keep previous search params`, async function() {
      const entry = new PrecacheEntry('example', '/url?foo=bar', '1234', true);
      expect(entry._networkRequest.url).to.equal(`${self.location}/url?foo=bar&_workbox-precaching=1234`);
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
