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

import {expect} from 'chai';
import sinon from 'sinon';
import {resetEventListeners} from '../../../infra/testing/sw-env-mocks/event-listeners.js';
import {OBJECT_STORE_NAME} from '../../../packages/workbox-background-sync/lib/constants.mjs';
import Queue from '../../../packages/workbox-background-sync/lib/Queue.mjs';
import QueueStore from '../../../packages/workbox-background-sync/lib/QueueStore.mjs';
import {_private} from '../../../packages/workbox-core/index.mjs';
import {NetworkFirst, NetworkOnly} from '../../../packages/workbox-runtime-caching/index.mjs';
import * as googleAnalytics from '../../../packages/workbox-google-analytics/index.mjs';
import {
  MAX_RETENTION_TIME,
  GOOGLE_ANALYTICS_HOST,
  ANALYTICS_JS_PATH,
  COLLECT_PATH,
} from '../../../packages/workbox-google-analytics/lib/constants.mjs';


const PAYLOAD = 'v=1&t=pageview&tid=UA-12345-1&cid=1&dp=%2F';

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

const waitUntil = async (test) => {
  if (test() === true) {
    return Promise.resolve();
  } else {
    await sleep(100);
    return waitUntil(test);
  }
};

// The TestError class is used in these tests to distinguish between expected
// unhandled promise rejections and unexpected ones.
class TestError extends Error {}
const catchUnhandledPromiseRejections = (err) => {
  if (!(err instanceof TestError)) {
    throw err;
  }
};

const clearObjectStore = async () => {
  // Get a reference to the DB by invoking _getDb on a mock instance.
  const db = await QueueStore.prototype._getDb.call({});

  await new Promise((resolve, reject) => {
    const txn = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    txn.onerror = () => reject(txn.error);
    txn.oncomplete = () => resolve();
    txn.objectStore(OBJECT_STORE_NAME).clear();
  });
};


describe(`[workbox-google-analytics] initialize`, function() {
  const sandbox = sinon.sandbox.create();
  const reset = () => {
    Queue._queueNames.clear();
    clearObjectStore();
    resetEventListeners();
    sandbox.restore();
  };
  process.on('unhandledRejection', catchUnhandledPromiseRejections);

  beforeEach(function() {
    reset();
    sandbox.stub(_private.logger);
  });

  after(function() {
    process.removeListener('unhandledRejection', catchUnhandledPromiseRejections);
    reset();
  });

  it(`should register a handler to cache the analytics.js script`, function() {
    sandbox.spy(NetworkFirst.prototype, 'handle');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(
          `https://${GOOGLE_ANALYTICS_HOST}${ANALYTICS_JS_PATH}`, {
        mode: 'no-cors',
      }),
    }));

    expect(NetworkFirst.prototype.handle.calledOnce).to.be.true;
  });

  it(`should register GET/POST routes for /collect`, function() {
    sandbox.spy(NetworkOnly.prototype, 'handle');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `${COLLECT_PATH}?${PAYLOAD}`, {
        method: 'GET',
      }),
    }));

    expect(NetworkOnly.prototype.handle.calledOnce).to.be.true;

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `${COLLECT_PATH}`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    expect(NetworkOnly.prototype.handle.calledTwice).to.be.true;
  });

  it(`should not alter successful hits`, async function() {
    sandbox.stub(self, 'fetch');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `${COLLECT_PATH}?${PAYLOAD}`, {
        method: 'GET',
      }),
    }));

    expect(self.fetch.calledOnce).to.be.true;
    expect(self.fetch.firstCall.args[0].url).to.equal(`https://` +
        `${GOOGLE_ANALYTICS_HOST}${COLLECT_PATH}?${PAYLOAD}`);

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `${COLLECT_PATH}`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    expect(self.fetch.calledTwice).to.be.true;

    const bodyText = await self.fetch.secondCall.args[0].text();
    expect(bodyText).to.equal(PAYLOAD);
  });

  it(`should add failed hits to a background sync queue`, async function() {
    sandbox.stub(self, 'fetch').rejects(new TestError());
    sandbox.spy(Queue.prototype, 'addRequest');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `${COLLECT_PATH}?${PAYLOAD}`, {
        method: 'GET',
      }),
    }));

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `${COLLECT_PATH}`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    await waitUntil(() => Queue.prototype.addRequest.callCount === 2);

    const [call1Args, call2Args] = Queue.prototype.addRequest.args;
    expect(call1Args[0].url).to.equal(`https://` +
        `${GOOGLE_ANALYTICS_HOST}${COLLECT_PATH}?${PAYLOAD}`);
    expect(call2Args[0].url).to.equal(`https://` +
        `${GOOGLE_ANALYTICS_HOST}${COLLECT_PATH}`);
  });

  it(`should add the qt param to replayed hits`, async function() {
    sandbox.stub(self, 'fetch').rejects(new TestError());
    sandbox.spy(Queue.prototype, 'addRequest');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `${COLLECT_PATH}?${PAYLOAD}&`, {
        method: 'GET',
      }),
    }));

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `${COLLECT_PATH}`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    await waitUntil(() => Queue.prototype.addRequest.callCount === 2);

    self.fetch.restore();
    sandbox.stub(self, 'fetch').resolves(new Response('', {status: 200}));

    const [queuePlugin] = Queue.prototype.addRequest.thisValues;
    await queuePlugin.replayRequests();

    expect(self.fetch.callCount).to.equal(2);

    const replay1 = self.fetch.firstCall.args[0];
    const replay2 = self.fetch.secondCall.args[0];


    const replayParams1 = new URLSearchParams(await replay1.text());
    const replayParams2 = new URLSearchParams(await replay2.text());
    const payloadParams = new URLSearchParams(PAYLOAD);

    expect(parseInt(replayParams1.get('qt'))).to.be.above(0);
    expect(parseInt(replayParams1.get('qt'))).to.be.below(MAX_RETENTION_TIME);
    expect(parseInt(replayParams2.get('qt'))).to.be.above(0);
    expect(parseInt(replayParams2.get('qt'))).to.be.below(MAX_RETENTION_TIME);

    for (const [key, value] of payloadParams.entries()) {
      expect(replayParams1.get(key)).to.equal(value);
      expect(replayParams2.get(key)).to.equal(value);
    }
  });

  it(`should add parameterOverrides to replayed hits`, async function() {
    sandbox.stub(self, 'fetch').rejects(new TestError());
    sandbox.spy(Queue.prototype, 'addRequest');

    googleAnalytics.initialize({
      parameterOverrides: {
        cd1: 'replay',
        cm1: 1,
      },
    });

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `${COLLECT_PATH}?${PAYLOAD}`, {
        method: 'GET',
      }),
    }));

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `${COLLECT_PATH}`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    await waitUntil(() => Queue.prototype.addRequest.callCount === 2);

    self.fetch.restore();
    sandbox.stub(self, 'fetch').resolves(new Response('', {status: 200}));

    const [queue] = Queue.prototype.addRequest.thisValues;
    await queue.replayRequests();

    expect(self.fetch.callCount).to.equal(2);

    const replay1 = self.fetch.firstCall.args[0];
    const replay2 = self.fetch.secondCall.args[0];

    const replayParams1 = new URLSearchParams(await replay1.text());
    const replayParams2 = new URLSearchParams(await replay2.text());

    expect(replayParams1.get('qt')).to.be.ok;
    expect(replayParams1.get('cd1')).to.equal('replay');
    expect(replayParams1.get('cm1')).to.equal('1');

    expect(replayParams2.get('qt')).to.be.ok;
    expect(replayParams2.get('cd1')).to.equal('replay');
    expect(replayParams2.get('cm1')).to.equal('1');
  });

  it(`should apply the hitFilter to replayed hits`, async function() {
    sandbox.stub(self, 'fetch').rejects(new TestError());
    sandbox.spy(Queue.prototype, 'addRequest');

    googleAnalytics.initialize({
      hitFilter: (params) => {
        if (params.get('foo') === '1') {
          params.set('foo', 'bar');
        }
      },
    });

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `${COLLECT_PATH}?${PAYLOAD}&foo=1`, {
        method: 'GET',
      }),
    }));

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `${COLLECT_PATH}`, {
        method: 'POST',
        body: PAYLOAD + '&foo=2',
      }),
    }));

    await waitUntil(() => Queue.prototype.addRequest.callCount === 2);

    self.fetch.restore();
    sandbox.stub(self, 'fetch').resolves(new Response('', {status: 200}));

    const [queue] = Queue.prototype.addRequest.thisValues;
    await queue.replayRequests();

    expect(self.fetch.callCount).to.equal(2);

    const replay1 = self.fetch.firstCall.args[0];
    const replay2 = self.fetch.secondCall.args[0];

    const replayParams1 = new URLSearchParams(await replay1.text());
    const replayParams2 = new URLSearchParams(await replay2.text());

    expect(replayParams1.get('qt')).to.be.ok;
    expect(replayParams1.get('foo')).to.equal('bar');

    expect(replayParams2.get('qt')).to.be.ok;
    expect(replayParams2.get('foo')).to.equal('2');
  });
});
