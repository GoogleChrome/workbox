import {expect} from 'chai';
import sinon from 'sinon';
import clearRequire from 'clear-require';
import makeServiceWorkerEnv from 'service-worker-mock';

import '../../../mocks/mock-fetch';

const PRECACHE_ENTRY_PATH = '../../../../packages/workbox-precaching/models/PrecacheEntry.mjs';
const MOCK_LOCATION = 'https://example.com';

describe('[workbox-precaching] PrecacheEntry', function() {
  const sandbox = sinon.sandbox.create();

  before(function() {
    const swEnv = makeServiceWorkerEnv();

    // This is needed to ensure new URL('/', location), works.
    swEnv.location = MOCK_LOCATION;

    Object.assign(global, swEnv);
  });

  beforeEach(async function() {
    process.env.NODE_ENV = 'dev';
    clearRequire.all();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('constructor', function() {
    it(`should use search param if 'cache' option is not supported`, async function() {
      const PrecacheEntryModule = await import(PRECACHE_ENTRY_PATH);
      const PrecacheEntry = PrecacheEntryModule.default;
      const entry = new PrecacheEntry('example', '/url', '1234', new Request('/url'), true);
      expect(entry._networkRequest.url).to.equal(`${MOCK_LOCATION}/url?_workbox-precaching=1234`);
    });

    it(`should use search param if 'cache' option is not supported and keep previous search params`, async function() {
      const PrecacheEntryModule = await import(PRECACHE_ENTRY_PATH);
      const PrecacheEntry = PrecacheEntryModule.default;
      const entry = new PrecacheEntry('example', '/url', '1234', new Request('/url?foo=bar'), true);
      expect(entry._networkRequest.url).to.equal(`${MOCK_LOCATION}/url?foo=bar&_workbox-precaching=1234`);
    });

    it(`should use 'cache' option if supported`, async function() {
      const PrecacheEntryModule = await import(PRECACHE_ENTRY_PATH);
      const PrecacheEntry = PrecacheEntryModule.default;

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

      const entry = new PrecacheEntry('example', '/url', '1234', new Request('/url'), true);
      expect(entry._networkRequest.url).to.equal(`/url`);
      expect(entry._networkRequest.cache).to.equal(`reload`);
    });
  });
});
