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

const testLogic = (initialUrls, expectedUrls, time, additionalParameters) => {
  return Promise.all(initialUrls.map(url => {
    return enqueueRequest(new Request(url), time);
  })).then(() => replayRequests(additionalParameters))
    .then(() => fetchMock.calls().matched.map(match => match[0]))
    .then(matchedUrls =>
      chai.expect(matchedUrls).to.include.members(expectedUrls))
    .then(() => idbHelper.getAllKeys())
    .then(keys => chai.expect(keys).to.not.include.members(expectedUrls));
};

describe('replay-queued-requests', () => {
  const urlPrefix = 'https://replay-queued-requests.com/';
  const initialTimestamp = 1470405670000; // An arbitrary, but valid, timestamp in milliseconds.
  const timestampOffset = 1000; // A 1000 millisecond offset.

  before(() => {
    fetchMock.mock(`^${urlPrefix}`, new Response());
    MockDate.set(initialTimestamp + timestampOffset);
  });

  after(() => {
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

  it('should replay queued requests with additional parameters', () => {
    const urls = ['one', 'two?three=4'].map(suffix => urlPrefix + suffix);
    const time = initialTimestamp;
    const additionalParameters = {
      three: 5,
      four: 'six',
      qt: timestampOffset
    };
    const urlsWithAdditionalParameters = urls.map(url => {
      const newUrl = new URL(url);
      Object.keys(additionalParameters).sort().forEach(parameter => {
        newUrl.searchParams.set(parameter, additionalParameters[parameter]);
      });
      return newUrl.toString();
    });

    return testLogic(urls, urlsWithAdditionalParameters, time,
      additionalParameters);
  });

  after(() => {
    fetchMock.restore();
  });
});
