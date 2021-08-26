/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {CacheableResponse} from 'workbox-cacheable-response/CacheableResponse.mjs';

describe(`CacheableResponse`, function () {
  const VALID_STATUS = 418;
  const INVALID_STATUS = 500;
  const VALID_STATUSES = [VALID_STATUS];
  const VALID_HEADERS = {
    'x-test': 'true',
  };

  describe(`constructor`, function () {
    it(`should throw with no config`, async function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      await expectError(
        () => {
          new CacheableResponse();
        },
        'statuses-or-headers-required',
        (err) => {
          expect(err.details)
            .to.have.property('moduleName')
            .that.eql('workbox-cacheable-response');
          expect(err.details)
            .to.have.property('className')
            .that.eql('CacheableResponse');
          expect(err.details)
            .to.have.property('funcName')
            .that.eql('constructor');
        },
      );
    });

    it(`should throw with bad config.statuses`, async function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      await expectError(
        () => {
          new CacheableResponse({statuses: 'bad input'});
        },
        'not-an-array',
        (err) => {
          expect(err.details)
            .to.have.property('moduleName')
            .that.eql('workbox-cacheable-response');
          expect(err.details)
            .to.have.property('className')
            .that.eql('CacheableResponse');
          expect(err.details)
            .to.have.property('funcName')
            .that.eql('constructor');
          expect(err.details)
            .to.have.property('paramName')
            .that.eql('config.statuses');
        },
      );
    });

    it(`should throw with bad config.headers`, async function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      await expectError(
        () => {
          new CacheableResponse({headers: 'bad input'});
        },
        'incorrect-type',
        (err) => {
          expect(err.details)
            .to.have.property('moduleName')
            .that.eql('workbox-cacheable-response');
          expect(err.details)
            .to.have.property('className')
            .that.eql('CacheableResponse');
          expect(err.details)
            .to.have.property('funcName')
            .that.eql('constructor');
          expect(err.details)
            .to.have.property('paramName')
            .that.eql('config.headers');
        },
      );
    });

    it(`should be able to construct with config.statuses`, function () {
      const cacheableResponse = new CacheableResponse({
        statuses: VALID_STATUSES,
      });

      expect(cacheableResponse._statuses).to.eql(VALID_STATUSES);
    });

    it(`should be able to construct with config.headers`, function () {
      const cacheableResponse = new CacheableResponse({headers: VALID_HEADERS});

      expect(cacheableResponse._headers).to.eql(VALID_HEADERS);
    });

    it(`should be able to construct with config.statuses and config.headers`, function () {
      const cacheableResponse = new CacheableResponse({
        statuses: VALID_STATUSES,
        headers: VALID_HEADERS,
      });

      expect(cacheableResponse._statuses).to.eql(VALID_STATUSES);
      expect(cacheableResponse._headers).to.eql(VALID_HEADERS);
    });
  });

  describe(`isResponseCacheable`, function () {
    it(`should throw when passed bad input`, async function () {
      if (process.env.NODE_ENV === 'production') this.skip();

      const cacheableResponse = new CacheableResponse({
        statuses: VALID_STATUSES,
      });
      await expectError(
        () => {
          cacheableResponse.isResponseCacheable(null);
        },
        'incorrect-class',
        (err) => {
          expect(err.details)
            .to.have.property('moduleName')
            .that.eql('workbox-cacheable-response');
          expect(err.details)
            .to.have.property('className')
            .that.eql('CacheableResponse');
          expect(err.details)
            .to.have.property('funcName')
            .that.eql('isResponseCacheable');
          expect(err.details)
            .to.have.property('paramName')
            .that.eql('response');
        },
      );
    });

    it(`should return true when one of the statuses match the response`, function () {
      const cacheableResponse = new CacheableResponse({
        statuses: VALID_STATUSES,
      });
      const response = new Response('', {status: VALID_STATUS});

      expect(cacheableResponse.isResponseCacheable(response)).to.be.true;
    });

    it(`should return false when none of the statuses match the response`, function () {
      const cacheableResponse = new CacheableResponse({
        statuses: VALID_STATUSES,
      });
      const response = new Response('', {status: INVALID_STATUS});

      expect(cacheableResponse.isResponseCacheable(response)).to.be.false;
    });

    it(`should return true when one of the headers match the response`, function () {
      const cacheableResponse = new CacheableResponse({headers: VALID_HEADERS});
      const response = new Response('', {headers: VALID_HEADERS});

      expect(cacheableResponse.isResponseCacheable(response)).to.be.true;
    });

    it(`should return false when none of the headers match the response`, function () {
      const cacheableResponse = new CacheableResponse({headers: VALID_HEADERS});
      const response = new Response('', {
        headers: {
          key: 'value',
        },
      });

      expect(cacheableResponse.isResponseCacheable(response)).to.be.false;
    });

    it(`should return false when one of the statuses match the response, but none of the headers match`, function () {
      const cacheableResponse = new CacheableResponse({
        statuses: VALID_STATUSES,
        headers: VALID_HEADERS,
      });
      const response = new Response('', {status: VALID_STATUS});

      expect(cacheableResponse.isResponseCacheable(response)).to.be.false;
    });

    it(`should return false when one of the headers match the response, but none of the statuses match`, function () {
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

    it(`should return true when both the headers and statuses match the response`, function () {
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
