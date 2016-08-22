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
/* global chai */

'use strict';

const IDBHelper = require('../../../../lib/idb-helper.js');
const MockDate = require('mockdate');
const constants = require('../../src/lib/constants.js');
const enqueueRequest = require('../../src/lib/enqueue-request');
const fetchMock = require('fetch-mock');
const replayRequests = require('../../src/lib/replay-queued-requests.js');

const idbHelper = new IDBHelper(constants.IDB.NAME, constants.IDB.VERSION,
  constants.IDB.STORE);

const testLogic = (initialUrls, expectedUrls, time, opts) => {
  return Promise.all(initialUrls.map(url => {
    return enqueueRequest(new Request(url), time);
  })).then(() => replayRequests(opts))
    .then(() => fetchMock.calls().matched.map(match => match[0]))
    .then(matchedUrls => chai.expect(matchedUrls).to.deep.equal(expectedUrls))
    .then(() => idbHelper.getAllKeys())
    .then(keys => chai.expect(keys.length).to.equal(0));
};

describe('replay-queued-requests', () => {
  const urlPrefix = 'https://replay-queued-requests.com/';
  const initialTimestamp = 1470405670000; // An arbitrary, but valid, timestamp in milliseconds.
  const timestampOffset = 1000; // A 1000 millisecond offset.

  beforeEach(() => {
    fetchMock.mock(`^${urlPrefix}`, new Response());
    MockDate.set(initialTimestamp + timestampOffset);
  });

  afterEach(() => {
    fetchMock.reset();
    MockDate.reset();
  });

  it('should replay queued requests', () => {
    const urls = ['one', 'two?three=4'].map(suffix => urlPrefix + suffix);
    const time = initialTimestamp;
    const urlsWithQt = urls.map(url => {
      const newUrl = new URL(url);
      newUrl.searchParams.set('qt', timestampOffset);
      return newUrl.toString();
    });

    return testLogic(urls, urlsWithQt, time);
  });

  it('should replay queued requests with parameters overrides', () => {
    const urls = ['one', 'two?three=4'].map(suffix => urlPrefix + suffix);
    const time = initialTimestamp;
    const parameterOverrides = {
      three: 5,
      four: 'six',
      qt: timestampOffset
    };
    const urlsWithParameterOverrides = urls.map(url => {
      const newUrl = new URL(url);
      Object.keys(parameterOverrides).sort().forEach(parameter => {
        newUrl.searchParams.set(parameter, parameterOverrides[parameter]);
      });
      return newUrl.toString();
    });

    return testLogic(urls, urlsWithParameterOverrides, time,
      {parameterOverrides});
  });

  it('should replay queued requests with a hit filter', () => {
    const urls = ['one', 'two?three=4'].map(suffix => urlPrefix + suffix);
    const time = initialTimestamp;
    const hitFilter = searchParams => {
      const qt = searchParams.get('qt');
      searchParams.set('cm1', qt);
    };
    const urlsWithHitFilterApplied = urls.map(url => {
      const newUrl = new URL(url);
      newUrl.searchParams.set('qt', timestampOffset);
      newUrl.searchParams.set('cm1', timestampOffset);
      return newUrl.toString();
    });

    return testLogic(urls, urlsWithHitFilterApplied, time,
      {hitFilter});
  });

  it('should not a replay queued requests when hit filter throws', () => {
    const urls = ['one', 'two?three=4'].map(suffix => urlPrefix + suffix);
    const time = initialTimestamp;
    const hitFilter = searchParams => {
      const qt = searchParams.get('qt');
      searchParams.set('cm1', qt);
      if (searchParams.get('three') === '4') {
        throw new Error('abort!');
      }
    };
    const urlsWithHitFilterApplied = urls.slice(0, 1).map(url => {
      const newUrl = new URL(url);
      newUrl.searchParams.set('qt', timestampOffset);
      newUrl.searchParams.set('cm1', timestampOffset);
      return newUrl.toString();
    });

    return testLogic(urls, urlsWithHitFilterApplied, time,
      {hitFilter});
  });

  after(() => {
    fetchMock.restore();
  });
});
