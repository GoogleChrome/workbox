/*
 Copyright 2017 Google Inc. All Rights Reserved.
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

const mockFetch = require('./mock-fetch');
const {IDBFactory, IDBKeyRange} = require('shelving-mock-indexeddb');
const makeServiceWorkerEnv = require('service-worker-mock');

global.fetch = mockFetch;
global.indexedDB = new IDBFactory();
global.IDBKeyRange = IDBKeyRange;

const swEnv = makeServiceWorkerEnv();

// This is needed to ensure new URL('/', location), works.
swEnv.location = 'https://example.com';

// See https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/FetchEvent
class FetchEvent {
  constructor(type, init) {
    this.type = type;
    this.request = init.request;
    this.clientId = init.clientId;
    this.isReload = init.isReload;
  }
}
swEnv.FetchEvent = FetchEvent;

class FakeSWGlobalScope {}
swEnv.ServiceWorkerGlobalScope = FakeSWGlobalScope;

Object.assign(global, swEnv);
