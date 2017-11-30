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
import {reset as iDBReset} from 'shelving-mock-indexeddb';
import {eventsDoneWaiting, resetEventListeners} from '../../../infra/testing/sw-env-mocks/event-listeners.js';
import {Queue} from '../../../packages/workbox-background-sync/Queue.mjs';
import {cacheNames} from '../../../packages/workbox-core/_private/cacheNames.mjs';
import {NetworkFirst, NetworkOnly} from '../../../packages/workbox-strategies/index.mjs';
import * as googleAnalytics from '../../../packages/workbox-google-analytics/index.mjs';
import {
  MAX_RETENTION_TIME,
  GOOGLE_ANALYTICS_HOST,
  GTM_HOST,
  ANALYTICS_JS_PATH,
  GTAG_JS_PATH,
} from '../../../packages/workbox-google-analytics/utils/constants.mjs';

const PAYLOAD = 'v=1&t=pageview&tid=UA-12345-1&cid=1&dp=%2F';

describe(`[workbox-google-analytics] initialize`, function() {
  const sandbox = sinon.sandbox.create();
  const reset = async () => {
    Queue._queueNames.clear();
    resetEventListeners();
    sandbox.restore();
    iDBReset();

    const usedCaches = await caches.keys();
    await Promise.all(usedCaches.map((cacheName) => caches.delete(cacheName)));
  };

  beforeEach(async function() {
    await reset();
  });

  after(async function() {
    await reset();
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

  it(`should register a handler to cache the gtag.js script`, function() {
    sandbox.spy(NetworkFirst.prototype, 'handle');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(
          `https://${GTM_HOST}${GTAG_JS_PATH}?id=UA-XXXXX-Y`, {
        mode: 'no-cors',
      }),
    }));

    expect(NetworkFirst.prototype.handle.calledOnce).to.be.true;
  });

  it(`should accept an optional cache name`, async function() {
    googleAnalytics.initialize({cacheName: 'foobar'});

    const analyticsJsRequest = new Request(
        `https://${GOOGLE_ANALYTICS_HOST}${ANALYTICS_JS_PATH}`, {
      mode: 'no-cors',
    });

    self.dispatchEvent(new FetchEvent('fetch', {request: analyticsJsRequest}));

    await eventsDoneWaiting();

    const usedCaches = await caches.keys();
    expect(usedCaches).to.have.lengthOf(1);
    expect(usedCaches[0]).to.equal('foobar');

    const cache = await caches.open('foobar');
    const cachedResponse = await cache.match(analyticsJsRequest);
    expect(cachedResponse).to.be.instanceOf(Response);
  });

  it(`should use the default cache name when not specified`, async function() {
    googleAnalytics.initialize();

    const analyticsJsRequest = new Request(
        `https://${GOOGLE_ANALYTICS_HOST}${ANALYTICS_JS_PATH}`, {
      mode: 'no-cors',
    });

    self.dispatchEvent(new FetchEvent('fetch', {request: analyticsJsRequest}));

    await eventsDoneWaiting();

    const defaultCacheName = cacheNames.getGoogleAnalyticsName();
    const usedCaches = await caches.keys();
    expect(usedCaches).to.have.lengthOf(1);
    expect(usedCaches[0]).to.equal(defaultCacheName);

    const cache = await caches.open(defaultCacheName);
    const cachedResponse = await cache.match(analyticsJsRequest);
    expect(cachedResponse).to.be.instanceOf(Response);
  });

  it(`should register GET/POST routes for collect endpoints`, function() {
    sandbox.spy(NetworkOnly.prototype, 'handle');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `/collect?${PAYLOAD}`, {
        method: 'GET',
      }),
    }));

    expect(NetworkOnly.prototype.handle.callCount).to.equal(1);

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/collect`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    expect(NetworkOnly.prototype.handle.callCount).to.equal(2);

    // Test the experimental /r/collect endpoint
    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `/r/collect?${PAYLOAD}`, {
        method: 'GET',
      }),
    }));

    expect(NetworkOnly.prototype.handle.callCount).to.equal(3);

    // Test the experimental /r/collect endpoint
    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/r/collect`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    expect(NetworkOnly.prototype.handle.callCount).to.equal(4);
  });

  it(`should not alter successful hit payloads`, async function() {
    sandbox.spy(self, 'fetch');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `/collect?${PAYLOAD}`, {
        method: 'GET',
      }),
    }));

    expect(self.fetch.calledOnce).to.be.true;
    expect(self.fetch.firstCall.args[0].url).to.equal(`https://` +
        `${GOOGLE_ANALYTICS_HOST}/collect?${PAYLOAD}`);

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/collect`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    expect(self.fetch.calledTwice).to.be.true;

    const bodyText = await self.fetch.secondCall.args[0].text();
    expect(bodyText).to.equal(PAYLOAD);
  });

  it(`should not alter hit paths`, async function() {
    sandbox.spy(self, 'fetch');

    googleAnalytics.initialize();

    // Test the /r/collect endpoint
    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `/r/collect?${PAYLOAD}`, {
        method: 'GET',
      }),
    }));

    expect(self.fetch.calledOnce).to.be.true;
    expect(self.fetch.firstCall.args[0].url).to.equal(`https://` +
        `${GOOGLE_ANALYTICS_HOST}/r/collect?${PAYLOAD}`);

    // Test the /r/collect endpoint
    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/r/collect`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    expect(self.fetch.calledTwice).to.be.true;
    expect(self.fetch.secondCall.args[0].url).to.equal(`https://` +
        `${GOOGLE_ANALYTICS_HOST}/r/collect`);
  });

  it(`should add failed hits to a background sync queue`, async function() {
    sandbox.stub(self, 'fetch').rejects();
    sandbox.spy(Queue.prototype, 'addRequest');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `/collect?${PAYLOAD}`, {
        method: 'GET',
      }),
    }));

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/collect`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    await eventsDoneWaiting();

    const [call1Args, call2Args] = Queue.prototype.addRequest.args;
    expect(call1Args[0].url).to.equal(`https://` +
        `${GOOGLE_ANALYTICS_HOST}/collect?${PAYLOAD}`);
    expect(call2Args[0].url).to.equal(`https://` +
        `${GOOGLE_ANALYTICS_HOST}/collect`);
  });

  it(`should add the qt param to replayed hits`, async function() {
    sandbox.stub(self, 'fetch').rejects();
    sandbox.spy(Queue.prototype, 'addRequest');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `/collect?${PAYLOAD}&`, {
        method: 'GET',
      }),
    }));

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/collect`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    await eventsDoneWaiting();

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
    sandbox.stub(self, 'fetch').rejects();
    sandbox.spy(Queue.prototype, 'addRequest');

    googleAnalytics.initialize({
      parameterOverrides: {
        cd1: 'replay',
        cm1: 1,
      },
    });

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}` +
          `/collect?${PAYLOAD}`, {
        method: 'GET',
      }),
    }));

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/collect`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    await eventsDoneWaiting();

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
    sandbox.stub(self, 'fetch').rejects();
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
          `/collect?${PAYLOAD}&foo=1`, {
        method: 'GET',
      }),
    }));

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/collect`, {
        method: 'POST',
        body: PAYLOAD + '&foo=2',
      }),
    }));

    await eventsDoneWaiting();

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
