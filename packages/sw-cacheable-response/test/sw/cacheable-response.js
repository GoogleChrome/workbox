importScripts(
  '/node_modules/mocha/mocha.js',
  '/node_modules/chai/chai.js',
  '/node_modules/sw-testing-helpers/build/browser/mocha-utils.js',
  '/packages/sw-cacheable-response/build/sw-cacheable-response.js'
);

const expect = self.chai.expect;
mocha.setup({
  ui: 'bdd',
  reporter: null,
});

describe('Test of the CacheableResponse class', function() {
  const VALID_STATUS = 418;
  const INVALID_STATUS = 500;
  const VALID_STATUSES = [VALID_STATUS];
  const VALID_HEADERS = {
    'x-test': 'true',
  };

  it(`should throw when CacheableResponse() is called without any parameters`, function() {
    let thrownError = null;
    try {
      new goog.cacheableResponse.CacheableResponse();
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('atLeastOne');
  });

  it(`should throw when CacheableResponse() is called with an invalid 'statuses' parameter`, function() {
    let thrownError = null;
    try {
      new goog.cacheableResponse.CacheableResponse({statuses: [null]});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('isArrayOfType');
  });

  it(`should throw when CacheableResponse() is called with an invalid 'headers' parameter`, function() {
    let thrownError = null;
    try {
      new goog.cacheableResponse.CacheableResponse({headers: 0});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('isType');
  });

  it(`should throw when isResponseCacheable() is called with an invalid 'response' parameter`, function() {
    let thrownError = null;
    try {
      const cacheableResponse = new goog.cacheableResponse.CacheableResponse(
        {statuses: VALID_STATUSES});
      cacheableResponse.isResponseCacheable({response: null});
    } catch(err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('isInstance');
  });

  it(`should return true when one of the 'statuses' parameter values match`, function() {
    const cacheableResponse = new goog.cacheableResponse.CacheableResponse(
      {statuses: VALID_STATUSES});
    const response = new Response('', {status: VALID_STATUS});
    expect(cacheableResponse.isResponseCacheable({response})).to.be.true;
  });

  it(`should return false when none of the 'statuses' parameter values match`, function() {
    const cacheableResponse = new goog.cacheableResponse.CacheableResponse(
      {statuses: VALID_STATUSES});
    const response = new Response('', {status: INVALID_STATUS});
    expect(cacheableResponse.isResponseCacheable({response})).to.be.false;
  });

  it(`should return true when one of the 'headers' parameter values match`, function() {
    const cacheableResponse = new goog.cacheableResponse.CacheableResponse(
      {headers: VALID_HEADERS});
    const response = new Response('', {headers: VALID_HEADERS});
    expect(cacheableResponse.isResponseCacheable({response})).to.be.true;
  });

  it(`should return false when none of the 'headers' parameter values match`, function() {
    const cacheableResponse = new goog.cacheableResponse.CacheableResponse(
      {headers: VALID_HEADERS});
    const response = new Response('');
    expect(cacheableResponse.isResponseCacheable({response})).to.be.false;
  });

  it(`should return false when one of the 'statuses' parameter values match, but none of the 'headers' parameter values match`, function() {
    const cacheableResponse = new goog.cacheableResponse.CacheableResponse(
      {statuses: VALID_STATUSES, headers: VALID_HEADERS});
    const response = new Response('', {status: VALID_STATUS});
    expect(cacheableResponse.isResponseCacheable({response})).to.be.false;
  });

  it(`should return false when one of the 'headers' parameter values match, but none of the 'statuses' parameter values match`, function() {
    const cacheableResponse = new goog.cacheableResponse.CacheableResponse(
      {statuses: VALID_STATUSES, headers: VALID_HEADERS});
    const response = new Response('', {headers: VALID_HEADERS, status: INVALID_STATUS});
    expect(cacheableResponse.isResponseCacheable({response})).to.be.false;
  });

  it(`should return true when both the 'headers' and 'statuses' parameter values match`, function() {
    const cacheableResponse = new goog.cacheableResponse.CacheableResponse(
      {VALID_STATUSES, headers: VALID_HEADERS});
    const response = new Response('', {headers: VALID_HEADERS, status: VALID_STATUS});
    expect(cacheableResponse.isResponseCacheable({response})).to.be.true;
  });
});
