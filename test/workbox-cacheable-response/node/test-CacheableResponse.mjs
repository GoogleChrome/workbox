import {expect} from 'chai';

import {CacheableResponse} from '../../../packages/workbox-cacheable-response/CacheableResponse.mjs';
import expectError from '../../../infra/testing/expectError';
import {devOnly} from '../../../infra/testing/env-it';

describe(`[workbox-cacheable-response] CacheableResponse`, function() {
  const VALID_STATUS = 418;
  const INVALID_STATUS = 500;
  const VALID_STATUSES = [VALID_STATUS];
  const VALID_HEADERS = {
    'x-test': 'true',
  };

  describe(`constructor`, function() {
    devOnly.it(`should throw with no config`, async function() {
      await expectError(() => {
        new CacheableResponse();
      }, 'statuses-or-headers-required', (err) => {
        expect(err.details).to.have.property('moduleName').that.eql('workbox-cacheable-response');
        expect(err.details).to.have.property('className').that.eql('CacheableResponse');
        expect(err.details).to.have.property('funcName').that.eql('constructor');
      });
    });

    devOnly.it(`should throw with bad config.statuses`, async function() {
      await expectError(() => {
        new CacheableResponse({statuses: 'bad input'});
      }, 'not-an-array', (err) => {
        expect(err.details).to.have.property('moduleName').that.eql('workbox-cacheable-response');
        expect(err.details).to.have.property('className').that.eql('CacheableResponse');
        expect(err.details).to.have.property('funcName').that.eql('constructor');
        expect(err.details).to.have.property('paramName').that.eql('config.statuses');
      });
    });

    devOnly.it(`should throw with bad config.headers`, async function() {
      await expectError(() => {
        new CacheableResponse({headers: 'bad input'});
      }, 'incorrect-type', (err) => {
        expect(err.details).to.have.property('moduleName').that.eql('workbox-cacheable-response');
        expect(err.details).to.have.property('className').that.eql('CacheableResponse');
        expect(err.details).to.have.property('funcName').that.eql('constructor');
        expect(err.details).to.have.property('paramName').that.eql('config.headers');
      });
    });

    it(`should be able to construct with config.statuses`, function() {
      const cacheableResponse = new CacheableResponse({statuses: VALID_STATUSES});

      expect(cacheableResponse._statuses).to.eql(VALID_STATUSES);
    });

    it(`should be able to construct with config.headers`, function() {
      const cacheableResponse = new CacheableResponse({headers: VALID_HEADERS});

      expect(cacheableResponse._headers).to.eql(VALID_HEADERS);
    });

    it(`should be able to construct with config.statuses and config.headers`, function() {
      const cacheableResponse = new CacheableResponse({
        statuses: VALID_STATUSES,
        headers: VALID_HEADERS,
      });

      expect(cacheableResponse._statuses).to.eql(VALID_STATUSES);
      expect(cacheableResponse._headers).to.eql(VALID_HEADERS);
    });
  });

  describe(`isResponseCacheable`, function() {
    devOnly.it(`should throw when passed bad input`, async function() {
      const cacheableResponse = new CacheableResponse({statuses: VALID_STATUSES});
      await expectError(() => {
        cacheableResponse.isResponseCacheable(null);
      }, 'incorrect-class', (err) => {
        expect(err.details).to.have.property('moduleName').that.eql('workbox-cacheable-response');
        expect(err.details).to.have.property('className').that.eql('CacheableResponse');
        expect(err.details).to.have.property('funcName').that.eql('isResponseCacheable');
        expect(err.details).to.have.property('paramName').that.eql('response');
      });
    });

    it(`should return true when one of the statuses match the response`, function() {
      const cacheableResponse = new CacheableResponse({statuses: VALID_STATUSES});
      const response = new Response('', {status: VALID_STATUS});

      expect(cacheableResponse.isResponseCacheable(response)).to.be.true;
    });

    it(`should return false when none of the statuses match the response`, function() {
      const cacheableResponse = new CacheableResponse({statuses: VALID_STATUSES});
      const response = new Response('', {status: INVALID_STATUS});

      expect(cacheableResponse.isResponseCacheable(response)).to.be.false;
    });

    it(`should return true when one of the headers match the response`, function() {
      const cacheableResponse = new CacheableResponse({headers: VALID_HEADERS});
      const response = new Response('', {headers: VALID_HEADERS});

      expect(cacheableResponse.isResponseCacheable(response)).to.be.true;
    });

    it(`should return false when none of the headers match the response`, function() {
      const cacheableResponse = new CacheableResponse({headers: VALID_HEADERS});
      const response = new Response('');

      expect(cacheableResponse.isResponseCacheable(response)).to.be.false;
    });

    it(`should return false when one of the statuses match the response, but none of the headers match`, function() {
      const cacheableResponse = new CacheableResponse({
        statuses: VALID_STATUSES,
        headers: VALID_HEADERS,
      });
      const response = new Response('', {status: VALID_STATUS});

      expect(cacheableResponse.isResponseCacheable(response)).to.be.false;
    });

    it(`should return false when one of the headers match the response, but none of the statuses match`, function() {
      const cacheableResponse = new CacheableResponse({
        statuses: VALID_STATUSES,
        headers: VALID_HEADERS,
      });
      const response = new Response('', {
        headers: VALID_HEADERS,
        status: INVALID_STATUS,
      });

      expect(cacheableResponse.isResponseCacheable(response)).to.be.false;
    });

    it(`should return true when both the headers and statuses match the response`, function() {
      const cacheableResponse = new CacheableResponse({
        statuses: VALID_STATUSES,
        headers: VALID_HEADERS,
      });
      const response = new Response('', {
        headers: VALID_HEADERS,
        status: VALID_STATUS,
      });

      expect(cacheableResponse.isResponseCacheable(response)).to.be.true;
    });
  });
});
