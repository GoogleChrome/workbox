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

import IDBHelper from '../../../../lib/idb-helper.js';
import * as googleAnalytics from '../../src/index.js';
import constants from '../../src/lib/constants.js';
import {QueuePlugin} from '../../../workbox-background-sync/src/index.js';
import {NetworkFirst, NetworkOnly}
    from '../../../workbox-runtime-caching/src/index.js';

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

describe(`initialize`, function() {
  let idbMap = {};

  const stubIdbHelper = () => {
    sinon.stub(IDBHelper.prototype, 'get').callsFake(function(key) {
      const dbStore = `${this._name}|${this._storeName}`;
      idbMap[dbStore] = idbMap[dbStore] || {};
      return Promise.resolve(idbMap[dbStore][key]);
    });
    sinon.stub(IDBHelper.prototype, 'put').callsFake(function(key, value) {
      const dbStore = `${this._name}|${this._storeName}`;
      idbMap[dbStore] = idbMap[dbStore] || {};
      idbMap[dbStore][key] = value;
      return Promise.resolve();
    });
  };

  const restoreIdbHelper = () => {
    idbMap = {};
    IDBHelper.prototype.get.restore();
    IDBHelper.prototype.put.restore();
  };

  const trackAddedEventListeners = () => {
    sinon.spy(self, 'addEventListener');
  };

  const removeAllEventListeners = () => {
    for (const [evt, listener] of self.addEventListener.args) {
      self.removeEventListener(evt, listener);
    }
    self.addEventListener.restore();
  };

  beforeEach(function() {
    trackAddedEventListeners();
    stubIdbHelper();
  });

  afterEach(function() {
    removeAllEventListeners();
    restoreIdbHelper();
  });

  it(`should register a handler to cache the analytics.js script`, function() {
    sinon.spy(NetworkFirst.prototype, 'handle');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(
          `https://${constants.URL.HOST}${constants.URL.ANALYTICS_JS_PATH}`, {
        mode: 'no-cors',
      }),
    }));

    expect(NetworkFirst.prototype.handle.calledOnce).to.be.ok;

    NetworkFirst.prototype.handle.restore();
  });

  it(`should register GET/POST routes for /collect`, function() {
    sinon.spy(NetworkOnly.prototype, 'handle');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}?${PAYLOAD}`, {
        method: 'GET',
      }),
    }));

    expect(NetworkOnly.prototype.handle.calledOnce).to.be.ok;

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    expect(NetworkOnly.prototype.handle.calledTwice).to.be.ok;

    NetworkOnly.prototype.handle.restore();
  });

  it(`should not alter successful hits`, async function() {
    sinon.stub(self, 'fetch');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}?${PAYLOAD}`, {
        method: 'GET',
      }),
    }));

    expect(self.fetch.calledOnce).to.be.ok;
    expect(self.fetch.firstCall.args[0].url).to.equal(`https://` +
        `${constants.URL.HOST}${constants.URL.COLLECT_PATH}?${PAYLOAD}`);

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    expect(self.fetch.calledTwice).to.be.ok;

    const bodyText = await self.fetch.secondCall.args[0].text();
    expect(bodyText).to.equal(PAYLOAD);

    self.fetch.restore();
  });

  it(`should add failed hits to a background sync queue`, async function() {
    sinon.stub(self, 'fetch').rejects(Response.error());
    sinon.spy(QueuePlugin.prototype, 'pushIntoQueue');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}?${PAYLOAD}`, {
        method: 'GET',
      }),
    }));

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    await waitUntil(() => QueuePlugin.prototype.pushIntoQueue.callCount == 2);

    const [call1Args, call2Args] = QueuePlugin.prototype.pushIntoQueue.args;
    expect(call1Args[0].request.url).to.equal(`https://` +
        `${constants.URL.HOST}${constants.URL.COLLECT_PATH}?${PAYLOAD}`);
    expect(call2Args[0].request.url).to.equal(`https://` +
        `${constants.URL.HOST}${constants.URL.COLLECT_PATH}`);

    QueuePlugin.prototype.pushIntoQueue.restore();
    self.fetch.restore();
  });

  it(`should add the qt param to replayed hits`, async function() {
    sinon.stub(self, 'fetch').rejects(Response.error());
    sinon.spy(QueuePlugin.prototype, 'pushIntoQueue');

    googleAnalytics.initialize();

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}?${PAYLOAD}`, {
        method: 'GET',
      }),
    }));

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    await waitUntil(() => QueuePlugin.prototype.pushIntoQueue.callCount == 2);

    self.fetch.restore();
    sinon.stub(self, 'fetch').resolves(new Response('', {status: 200}));

    const [queuePlugin] = QueuePlugin.prototype.pushIntoQueue.thisValues;
    await queuePlugin.replayRequests();

    expect(self.fetch.callCount).to.equal(2);

    const replay1 = self.fetch.firstCall.args[0];
    const replay2 = self.fetch.secondCall.args[0];

    const replayParams1 = new URLSearchParams(await replay1.text());
    const replayParams2 = new URLSearchParams(await replay2.text());
    const payloadParams = new URLSearchParams(PAYLOAD);

    expect(parseInt(replayParams1.get('qt'))).to.be.above(0);
    expect(parseInt(replayParams1.get('qt'))).to.be.below(
        constants.STOP_RETRYING_AFTER);
    expect(parseInt(replayParams2.get('qt'))).to.be.above(0);
    expect(parseInt(replayParams2.get('qt'))).to.be.below(
        constants.STOP_RETRYING_AFTER);

    for (const [key, value] of payloadParams.entries()) {
      expect(replayParams1.get(key)).to.equal(value);
      expect(replayParams2.get(key)).to.equal(value);
    }

    QueuePlugin.prototype.pushIntoQueue.restore();
    self.fetch.restore();
  });

  it(`should add parameterOverrides to replayed hits`, async function() {
    sinon.stub(self, 'fetch').rejects(Response.error());
    sinon.spy(QueuePlugin.prototype, 'pushIntoQueue');

    googleAnalytics.initialize({
      parameterOverrides: {
        cd1: 'replay',
        cm1: 1,
      },
    });

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}?${PAYLOAD}`, {
        method: 'GET',
      }),
    }));

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}`, {
        method: 'POST',
        body: PAYLOAD,
      }),
    }));

    await waitUntil(() => QueuePlugin.prototype.pushIntoQueue.callCount == 2);

    self.fetch.restore();
    sinon.stub(self, 'fetch').resolves(new Response('', {status: 200}));

    const [queuePlugin] = QueuePlugin.prototype.pushIntoQueue.thisValues;
    await queuePlugin.replayRequests();

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

    QueuePlugin.prototype.pushIntoQueue.restore();
    self.fetch.restore();
  });

  it(`should apply the hitFilter to replayed hits`, async function() {
    sinon.stub(self, 'fetch').rejects(Response.error());
    sinon.spy(QueuePlugin.prototype, 'pushIntoQueue');

    googleAnalytics.initialize({
      hitFilter: (params) => {
        if (params.get('foo') == '1') {
          params.set('foo', 'bar');
        }
      },
    });

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}?${PAYLOAD}&foo=1`, {
        method: 'GET',
      }),
    }));

    self.dispatchEvent(new FetchEvent('fetch', {
      request: new Request(`https://${constants.URL.HOST}` +
          `${constants.URL.COLLECT_PATH}`, {
        method: 'POST',
        body: PAYLOAD + '&foo=2',
      }),
    }));

    await waitUntil(() => QueuePlugin.prototype.pushIntoQueue.callCount == 2);

    self.fetch.restore();
    sinon.stub(self, 'fetch').resolves(new Response('', {status: 200}));

    const [queuePlugin] = QueuePlugin.prototype.pushIntoQueue.thisValues;
    await queuePlugin.replayRequests();

    expect(self.fetch.callCount).to.equal(2);

    const replay1 = self.fetch.firstCall.args[0];
    const replay2 = self.fetch.secondCall.args[0];

    const replayParams1 = new URLSearchParams(await replay1.text());
    const replayParams2 = new URLSearchParams(await replay2.text());

    expect(replayParams1.get('qt')).to.be.ok;
    expect(replayParams1.get('foo')).to.equal('bar');

    expect(replayParams2.get('qt')).to.be.ok;
    expect(replayParams2.get('foo')).to.equal('2');

    QueuePlugin.prototype.pushIntoQueue.restore();
    self.fetch.restore();
  });
});
