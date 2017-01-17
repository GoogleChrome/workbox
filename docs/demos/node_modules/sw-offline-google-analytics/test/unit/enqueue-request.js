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
/* global chai, goog */

'use strict';

describe('enqueue-request', () => {
  const enqueueRequest = goog.offlineGoogleAnalytics.test.enqueueRequest;
  const constants = goog.offlineGoogleAnalytics.test.constants;
  const IDBHelper = goog.offlineGoogleAnalytics.test.IDBHelper;

  const idbHelper = new IDBHelper(constants.IDB.NAME, constants.IDB.VERSION,
    constants.IDB.STORE);

  it('should write to IndexedDB', () => {
    const url = 'https://enqueue-request.com/?random=' + Math.random();
    const request = new Request(url);
    return enqueueRequest(request)
      .then(() => idbHelper.getAllKeys())
      .then((keys) => chai.expect(keys).to.include(url));
  });

  it('should use the request body, when present, in the IndexedDB key', () => {
    const baseUrl = 'https://enqueue-request.com/';
    const body = 'random=' + Math.random();
    const url = `${baseUrl}?${body}`;

    const request = new Request(url, {method: 'POST', body});
    return enqueueRequest(request)
      .then(() => idbHelper.getAllKeys())
      .then((keys) => chai.expect(keys).to.include(url));
  });
});
