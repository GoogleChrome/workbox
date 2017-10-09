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
const {IDBFactory, IDBKeyRange} = require('shelving-mock-indexeddb');
const fetch = require('./mock-fetch');

Object.assign(global, makeServiceWorkerEnv());
global.self = global;

global.fetch = fetch;
global.indexedDB = new IDBFactory();
global.IDBKeyRange = IDBKeyRange;

// Stub missing/broken Headers API methods in `service-worker-mock`.
// https://fetch.spec.whatwg.org/#headers-class
class Headers {
  constructor(obj = {}) {
    this.obj = obj;
  }

  get(key) {
    return this.obj[key];
  }

  set(key, value) {
    this.obj[key] = value;
  }

  entries() {
    return Object.entries(this.obj);
  }

  // TODO: implement append() and [Symbol.iterator]()
}
global.Headers = Headers;

// Stub missing/broken Request API methods in `service-worker-mock`.
// https://fetch.spec.whatwg.org/#request-class
class Request {
  constructor(url, options = {}) {
    if (url instanceof Request) {
      options = url;
      url = options.url;
    }

    if (!url) {
      throw new TypeError(`Invalid url: ${url}`);
    }

    this.url = url;
    this.method = options.method || 'GET';
    this.mode = options.mode || 'same-origin'; // FF defaults to cors
    this.headers = new Headers(options.headers);

    this.bodyUsed = !!options.body;
    if (this.bodyUsed) {
      this.body = options.body;
    }
  }

  clone() {
    return new Request(this.url, this);
  }

  text() {
    return Promise.resolve(`${this.body || ''}`);
  }
}
global.Request = Request;


// Event
// https://dom.spec.whatwg.org/#event
class Event {
  constructor(type, eventInitDict = {}) {
    this.type = type;

    this.bubbles = eventInitDict.bubbles || false;
    this.cancelable = eventInitDict.cancelable || false;
    this.composed = eventInitDict.composed || false;
  }
}
global.Event = Event;

// ExtendibleEvent
// https://www.w3.org/TR/service-workers-1/#extendable-event
class ExtendableEvent extends Event {
  waitUntil(/* promise */) {
    // TODO(philipwalton): keep track of the promises added to each event
    // and expose them in some way so tests can assert logic doesn't run
    // after all ExtendableEvents have settled.
  }
}
global.ExtendableEvent = ExtendableEvent;

// SyncEvent
// https://wicg.github.io/BackgroundSync/spec/#sync-event
class SyncEvent extends ExtendableEvent {
  constructor(type, init = {}) {
    super(type, init);

    if (!init.tag) {
      throw new TypeError(
          `Failed to construct 'SyncEvent': required member tag is undefined.`);
    }

    this.tag = init.tag;
    this.lastChance = init.lastChance || false;
  }
}
global.SyncEvent = SyncEvent;

// Fix incorrect addEventListener stub
let listenerMap = new Map();

global.addEventListener = (type, listener /* TODO: support `opts` */) => {
  if (listenerMap.has(type)) {
    listenerMap.get(type).add(listener);
  } else {
    listenerMap.set(type, new Set([listener]));
  }
};

// dispatchEvent
global.dispatchEvent = (event) => {
  for (const listener of listenerMap.get(event.type)) {
    listener(event);
  }
};

global.__removeAllEventListeners = () => {
  listenerMap = new Map();
};


// Stub missing/broken ServiceWorkerRegistration API methods in `service-worker-mock`.
global.registration.sync = {register: () => {}};

// This is needed to ensure new URL('/', location), works.
global.location = 'https://example.com';

