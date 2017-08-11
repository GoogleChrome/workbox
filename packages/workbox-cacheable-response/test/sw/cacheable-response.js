/*
 Copyright 2016 Google Inc. All Rights Reserved.
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

/* eslint-env mocha, browser */

import CacheableResponse from '../../src/lib/cacheable-response.js';

describe(`Test of the CacheableResponse class`, function() {
  const VALID_STATUS = 418;
  const INVALID_STATUS = 500;
  const VALID_STATUSES = [VALID_STATUS];
  const VALID_HEADERS = {
    'x-test': 'true',
  };

  it(`should throw when CacheableResponse() is called without any parameters`, function() {
    let thrownError = null;
    try {
      new CacheableResponse();
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('assertion-failed');
  });

  it(`should throw when CacheableResponse() is called with an invalid 'statuses' parameter`, function() {
    let thrownError = null;
    try {
      new CacheableResponse({statuses: [null]});
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('assertion-failed');
  });

  it(`should throw when CacheableResponse() is called with an invalid 'headers' parameter`, function() {
    let thrownError = null;
    try {
      new CacheableResponse({headers: 0});
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('assertion-failed');
  });

  it(`should throw when isResponseCacheable() is called with an invalid 'response' parameter`, function() {
    let thrownError = null;
    try {
      const cacheableResponse = new CacheableResponse(
        {statuses: VALID_STATUSES});
      cacheableResponse.isResponseCacheable({response: null});
    } catch (err) {
      thrownError = err;
    }
    expect(thrownError).to.exist;
    expect(thrownError.name).to.equal('assertion-failed');
  });

  it(`should return true when one of the 'statuses' parameter values match`, function() {
    const cacheableResponse = new CacheableResponse(
      {statuses: VALID_STATUSES});
    const response = new Response('', {status: VALID_STATUS});
    expect(cacheableResponse.isResponseCacheable({response})).to.be.true;
  });

  it(`should return false when none of the 'statuses' parameter values match`, function() {
    const cacheableResponse = new CacheableResponse(
      {statuses: VALID_STATUSES});
    const response = new Response('', {status: INVALID_STATUS});
    expect(cacheableResponse.isResponseCacheable({response})).to.be.false;
  });

  it(`should return true when one of the 'headers' parameter values match`, function() {
    const cacheableResponse = new CacheableResponse(
      {headers: VALID_HEADERS});
    const response = new Response('', {headers: VALID_HEADERS});
    expect(cacheableResponse.isResponseCacheable({response})).to.be.true;
  });

  it(`should return false when none of the 'headers' parameter values match`, function() {
    const cacheableResponse = new CacheableResponse(
      {headers: VALID_HEADERS});
    const response = new Response('');
    expect(cacheableResponse.isResponseCacheable({response})).to.be.false;
  });

  it(`should return false when one of the 'statuses' parameter values match, but none of the 'headers' parameter values match`, function() {
    const cacheableResponse = new CacheableResponse(
      {statuses: VALID_STATUSES, headers: VALID_HEADERS});
    const response = new Response('', {status: VALID_STATUS});
    expect(cacheableResponse.isResponseCacheable({response})).to.be.false;
  });

  it(`should return false when one of the 'headers' parameter values match, but none of the 'statuses' parameter values match`, function() {
    const cacheableResponse = new CacheableResponse(
      {statuses: VALID_STATUSES, headers: VALID_HEADERS});
    const response = new Response('', {headers: VALID_HEADERS, status: INVALID_STATUS});
    expect(cacheableResponse.isResponseCacheable({response})).to.be.false;
  });

  it(`should return true when both the 'headers' and 'statuses' parameter values match`, function() {
    const cacheableResponse = new CacheableResponse(
      {VALID_STATUSES, headers: VALID_HEADERS});
    const response = new Response('', {headers: VALID_HEADERS, status: VALID_STATUS});
    expect(cacheableResponse.isResponseCacheable({response})).to.be.true;
  });
});
