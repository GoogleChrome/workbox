/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Queue} from 'workbox-background-sync/Queue.mjs';
import {QueueDb} from 'workbox-background-sync/lib/QueueDb.mjs';
import {cacheNames} from 'workbox-core/_private/cacheNames.mjs';
import {openDB} from 'idb';
import {initialize} from 'workbox-google-analytics/initialize.mjs';
import {
  GOOGLE_ANALYTICS_HOST,
  GTM_HOST,
  ANALYTICS_JS_PATH,
  GTAG_JS_PATH,
  GTM_JS_PATH,
} from 'workbox-google-analytics/utils/constants.mjs';
import {NetworkFirst} from 'workbox-strategies/NetworkFirst.mjs';
import {NetworkOnly} from 'workbox-strategies/NetworkOnly.mjs';
import {dispatchAndWaitUntilDone} from '../../../infra/testing/helpers/extendable-event-utils.mjs';

const PAYLOAD = 'v=1&t=pageview&tid=UA-12345-1&cid=1&dp=%2F';

describe(`initialize`, function () {
  const sandbox = sinon.createSandbox();
  let db = null;

  beforeEach(async function () {
    Queue._queueNames.clear();
    db = await openDB('workbox-background-sync', 3, {
      upgrade: QueueDb.prototype._upgradeDb,
    });
    sandbox.restore();
    await db.clear('requests');

    const usedCaches = await caches.keys();
    await Promise.all(usedCaches.map((cacheName) => caches.delete(cacheName)));

    // Spy on all added event listeners so they can be removed.
    sandbox.spy(self, 'addEventListener');

    // Don't actually register for a sync event in any test, as it could
    // make them non-deterministic.
    if ('sync' in registration) {
      sandbox.stub(registration.sync, 'register');
    }
  });

  afterEach(function () {
    for (const args of self.addEventListener.args) {
      self.removeEventListener(...args);
    }

    sandbox.restore();
  });

  it(`should register a handler to cache the analytics.js script`, async function () {
    sandbox.spy(NetworkFirst.prototype, 'handle');

    initialize();

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(
          `https://${GOOGLE_ANALYTICS_HOST}${ANALYTICS_JS_PATH}`,
          {
            mode: 'no-cors',
          },
        ),
      }),
    );

    expect(NetworkFirst.prototype.handle.calledOnce).to.be.true;
  });

  it(`should register a handler to cache the gtag.js script`, async function () {
    sandbox.spy(NetworkFirst.prototype, 'handle');

    initialize();

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(
          `https://${GTM_HOST}${GTAG_JS_PATH}?id=UA-XXXXX-Y`,
          {
            mode: 'no-cors',
          },
        ),
      }),
    );

    expect(NetworkFirst.prototype.handle.calledOnce).to.be.true;
  });

  it(`should register a handler to cache the gtm.js script`, async function () {
    sandbox.spy(NetworkFirst.prototype, 'handle');

    initialize();

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(`https://${GTM_HOST}${GTM_JS_PATH}?id=GTM-XXXX`, {
          mode: 'no-cors',
        }),
      }),
    );

    expect(NetworkFirst.prototype.handle.calledOnce).to.be.true;
  });

  it(`should accept an optional cache name`, async function () {
    initialize({cacheName: 'foobar'});

    const analyticsJsRequest = new Request(
      `https://${GOOGLE_ANALYTICS_HOST}${ANALYTICS_JS_PATH}`,
      {
        mode: 'no-cors',
      },
    );

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: analyticsJsRequest,
      }),
    );

    const usedCaches = await caches.keys();
    expect(usedCaches).to.have.lengthOf(1);
    expect(usedCaches[0]).to.equal('foobar');

    const cache = await caches.open('foobar');
    const cachedResponse = await cache.match(analyticsJsRequest);

    expect(cachedResponse).to.be.instanceOf(Response);
  });

  it(`should use the default cache name when not specified`, async function () {
    initialize();

    const analyticsJsRequest = new Request(
      `https://${GOOGLE_ANALYTICS_HOST}${ANALYTICS_JS_PATH}`,
      {
        mode: 'no-cors',
      },
    );

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: analyticsJsRequest,
      }),
    );

    const defaultCacheName = cacheNames.getGoogleAnalyticsName();
    const usedCaches = await caches.keys();
    expect(usedCaches).to.have.lengthOf(1);
    expect(usedCaches[0]).to.equal(defaultCacheName);

    const cache = await caches.open(defaultCacheName);
    const cachedResponse = await cache.match(analyticsJsRequest);
    expect(cachedResponse).to.be.instanceOf(Response);
  });

  it(`should register GET/POST routes for collect endpoints`, async function () {
    // Stub out fetch(), since this test is about routing, and doesn't need to
    // contact the production Google Analytics endpoints.
    sandbox.stub(self, 'fetch').callsFake(() => new Response('ignored'));

    sandbox.spy(NetworkOnly.prototype, 'handle');

    initialize();

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(
          `https://${GOOGLE_ANALYTICS_HOST}` + `/collect?${PAYLOAD}`,
          {
            method: 'GET',
          },
        ),
      }),
    );

    expect(NetworkOnly.prototype.handle.callCount).to.equal(1);

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/collect`, {
          method: 'POST',
          body: PAYLOAD,
        }),
      }),
    );

    expect(NetworkOnly.prototype.handle.callCount).to.equal(2);

    // Test the experimental /r/collect endpoint
    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(
          `https://${GOOGLE_ANALYTICS_HOST}` + `/r/collect?${PAYLOAD}`,
          {
            method: 'GET',
          },
        ),
      }),
    );

    expect(NetworkOnly.prototype.handle.callCount).to.equal(3);

    // Test the experimental /r/collect endpoint
    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/r/collect`, {
          method: 'POST',
          body: PAYLOAD,
        }),
      }),
    );

    expect(NetworkOnly.prototype.handle.callCount).to.equal(4);
  });

  it(`should not alter successful hit payloads`, async function () {
    // Stub out fetch(), since this test is about routing, and doesn't need to
    // contact the production Google Analytics endpoints.
    sandbox.stub(self, 'fetch').callsFake(() => new Response('ignored'));

    initialize();

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(
          `https://${GOOGLE_ANALYTICS_HOST}` + `/collect?${PAYLOAD}`,
          {
            method: 'GET',
          },
        ),
      }),
    );

    expect(self.fetch.calledOnce).to.be.true;
    expect(self.fetch.firstCall.args[0].url).to.equal(
      `https://` + `${GOOGLE_ANALYTICS_HOST}/collect?${PAYLOAD}`,
    );

    const request = new Request(`https://${GOOGLE_ANALYTICS_HOST}/collect`, {
      method: 'POST',
      body: PAYLOAD,
    });
    await dispatchAndWaitUntilDone(new FetchEvent('fetch', {request}));

    expect(self.fetch.calledTwice).to.be.true;

    // We can't compare payload bodies after the fetch has run, but if the
    // fetch succeeds and sends the request, we know the body wasn't altered.
    expect(self.fetch.secondCall.args[0]).to.equal(request);
  });

  it(`should not alter hit paths`, async function () {
    // Stub out fetch(), since this test is about routing, and doesn't need to
    // contact the production Google Analytics endpoints.
    sandbox.stub(self, 'fetch').callsFake(() => new Response('ignored'));

    initialize();

    // Test the /r/collect endpoint
    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(
          `https://${GOOGLE_ANALYTICS_HOST}` + `/r/collect?${PAYLOAD}`,
          {
            method: 'GET',
          },
        ),
      }),
    );

    expect(self.fetch.calledOnce).to.be.true;
    expect(self.fetch.firstCall.args[0].url).to.equal(
      `https://` + `${GOOGLE_ANALYTICS_HOST}/r/collect?${PAYLOAD}`,
    );

    // Test the /r/collect endpoint
    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/r/collect`, {
          method: 'POST',
          body: PAYLOAD,
        }),
      }),
    );

    expect(self.fetch.calledTwice).to.be.true;
    expect(self.fetch.secondCall.args[0].url).to.equal(
      `https://` + `${GOOGLE_ANALYTICS_HOST}/r/collect`,
    );
  });

  it(`should add failed hits to a background sync queue`, async function () {
    sandbox.stub(self, 'fetch').rejects();
    sandbox.spy(Queue.prototype, 'pushRequest');

    initialize();

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(
          `https://${GOOGLE_ANALYTICS_HOST}` + `/collect?${PAYLOAD}`,
          {
            method: 'GET',
          },
        ),
      }),
    );

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/collect`, {
          method: 'POST',
          body: PAYLOAD,
        }),
      }),
    );

    const [call1Args, call2Args] = Queue.prototype.pushRequest.args;
    expect(call1Args[0].request.url).to.equal(
      `https://` + `${GOOGLE_ANALYTICS_HOST}/collect?${PAYLOAD}`,
    );
    expect(call2Args[0].request.url).to.equal(
      `https://` + `${GOOGLE_ANALYTICS_HOST}/collect`,
    );
  });

  it(`should add the qt param to replayed hits`, async function () {
    sandbox.stub(self, 'fetch').rejects();
    const pushRequestSpy = sandbox.spy(Queue.prototype, 'pushRequest');
    const clock = sandbox.useFakeTimers({toFake: ['Date']});

    initialize();

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(
          `https://${GOOGLE_ANALYTICS_HOST}` + `/collect?${PAYLOAD}`,
          {
            method: 'GET',
          },
        ),
      }),
    );

    clock.tick(100);

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/r/collect`, {
          method: 'POST',
          body: PAYLOAD,
        }),
      }),
    );

    self.fetch.restore();
    sandbox.stub(self, 'fetch').resolves(new Response('', {status: 200}));

    clock.tick(100);

    // Manually trigger the `onSync` callback in both sync and non-sync
    // supporting browsers.
    if ('sync' in registration) {
      await dispatchAndWaitUntilDone(
        new SyncEvent('sync', {
          tag: `workbox-background-sync:workbox-google-analytics`,
        }),
      );
    } else {
      // Get the `this` context of the underlying Queue instance in order
      // to manually replay it.
      const queue = pushRequestSpy.thisValues[0];
      await queue._onSync({queue});
    }

    expect(self.fetch.callCount).to.equal(2);

    const replay1 = self.fetch.firstCall.args[0];
    const replay2 = self.fetch.secondCall.args[0];
    expect(replay1.url).to.equal(`https://${GOOGLE_ANALYTICS_HOST}/collect`);
    expect(replay2.url).to.equal(`https://${GOOGLE_ANALYTICS_HOST}/r/collect`);

    const replayParams1 = new URLSearchParams(await replay1.text());
    const replayParams2 = new URLSearchParams(await replay2.text());
    const payloadParams = new URLSearchParams(PAYLOAD);

    expect(parseInt(replayParams1.get('qt'))).to.equal(200);
    expect(parseInt(replayParams2.get('qt'))).to.equal(100);

    for (const [key, value] of payloadParams.entries()) {
      expect(replayParams1.get(key)).to.equal(value);
      expect(replayParams2.get(key)).to.equal(value);
    }
  });

  it(`should update an existing qt param`, async function () {
    sandbox.stub(self, 'fetch').rejects();
    const pushRequestSpy = sandbox.spy(Queue.prototype, 'pushRequest');
    const clock = sandbox.useFakeTimers({toFake: ['Date']});

    initialize();

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(
          `https://${GOOGLE_ANALYTICS_HOST}` + `/collect?${PAYLOAD}&qt=1000`,
          {
            method: 'GET',
          },
        ),
      }),
    );

    clock.tick(100);

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/r/collect`, {
          method: 'POST',
          body: `${PAYLOAD}&qt=3000`,
        }),
      }),
    );

    self.fetch.restore();
    sandbox.stub(self, 'fetch').resolves(new Response('', {status: 200}));

    clock.tick(100);

    // Manually trigger the `onSync` callback in both sync and non-sync
    // supporting browsers.
    if ('sync' in registration) {
      await dispatchAndWaitUntilDone(
        new SyncEvent('sync', {
          tag: `workbox-background-sync:workbox-google-analytics`,
        }),
      );
    } else {
      // Get the `this` context of the underlying Queue instance in order
      // to manually replay it.
      const queue = pushRequestSpy.thisValues[0];
      await queue._onSync({queue});
    }

    expect(self.fetch.callCount).to.equal(2);

    const replay1 = self.fetch.firstCall.args[0];
    const replay2 = self.fetch.secondCall.args[0];
    const replayParams1 = new URLSearchParams(await replay1.text());
    const replayParams2 = new URLSearchParams(await replay2.text());

    expect(parseInt(replayParams1.get('qt'))).to.equal(1200);
    expect(parseInt(replayParams2.get('qt'))).to.equal(3100);
  });

  it(`should add parameterOverrides to replayed hits`, async function () {
    sandbox.stub(self, 'fetch').rejects();
    const pushRequestSpy = sandbox.spy(Queue.prototype, 'pushRequest');

    initialize({
      parameterOverrides: {
        cd1: 'replay',
        cm1: 1,
      },
    });

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(
          `https://${GOOGLE_ANALYTICS_HOST}` + `/collect?${PAYLOAD}`,
          {
            method: 'GET',
          },
        ),
      }),
    );

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/collect`, {
          method: 'POST',
          body: PAYLOAD,
        }),
      }),
    );

    self.fetch.restore();
    sandbox.stub(self, 'fetch').resolves(new Response('', {status: 200}));

    // Manually trigger the `onSync` callback in both sync and non-sync
    // supporting browsers.
    if ('sync' in registration) {
      await dispatchAndWaitUntilDone(
        new SyncEvent('sync', {
          tag: `workbox-background-sync:workbox-google-analytics`,
        }),
      );
    } else {
      // Get the `this` context of the underlying Queue instance in order
      // to manually replay it.
      const queue = pushRequestSpy.thisValues[0];
      await queue._onSync({queue});
    }

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

  it(`should apply the hitFilter to replayed hits`, async function () {
    sandbox.stub(self, 'fetch').rejects();
    sandbox.spy(Queue.prototype, 'pushRequest');

    initialize({
      hitFilter: (params) => {
        if (params.get('foo') === '1') {
          params.set('foo', 'bar');
        }
      },
    });

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(
          `https://${GOOGLE_ANALYTICS_HOST}` + `/collect?${PAYLOAD}&foo=1`,
          {
            method: 'GET',
          },
        ),
      }),
    );

    await dispatchAndWaitUntilDone(
      new FetchEvent('fetch', {
        request: new Request(`https://${GOOGLE_ANALYTICS_HOST}/collect`, {
          method: 'POST',
          body: PAYLOAD + '&foo=2',
        }),
      }),
    );

    self.fetch.restore();
    sandbox.stub(self, 'fetch').resolves(new Response('', {status: 200}));

    // Manually trigger the `onSync` callback in both sync and non-sync
    // supporting browsers.
    if ('sync' in registration) {
      await dispatchAndWaitUntilDone(
        new SyncEvent('sync', {
          tag: `workbox-background-sync:workbox-google-analytics`,
        }),
      );
    } else {
      const queue = Queue.prototype.pushRequest.thisValues[0];
      await queue._onSync({queue});
    }

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
