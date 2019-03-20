/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {logger} from 'workbox-core/_private/logger.mjs';
import {checkSWFileCacheHeaders} from 'workbox-core/_private/checkSWFileCacheHeaders.mjs';


describe(`checkSWFileCacheHeaders`, function() {
  let sandbox = sinon.createSandbox();

  beforeEach(function() {
    if (process.env.NODE_ENV !== 'production') {
      sandbox.stub(logger);
    }
  });

  afterEach(function() {
    sandbox.restore();
  });

  it(`should handle bad response`, async function() {
    if (process.env.NODE_ENV === 'production') this.skip();

    sandbox.stub(self, 'fetch').callsFake(async () => {
      return new Response('Not Found.', {
        status: 404,
      });
    });

    await checkSWFileCacheHeaders();

    expect(logger.warn.callCount).to.equal(0);
  });

  it(`should handle no cache-control header`, async function() {
    if (process.env.NODE_ENV === 'production') this.skip();

    sandbox.stub(self, 'fetch').callsFake(async () => {
      return new Response('OK');
    });

    await checkSWFileCacheHeaders();

    expect(logger.warn.callCount).to.equal(0);
  });

  it(`should log for bad cache-control header`, async function() {
    if (process.env.NODE_ENV === 'production') this.skip();

    sandbox.stub(self, 'fetch').callsFake(async () => {
      return new Response('OK', {
        headers: {
          'cache-control': 'max-age=2000',
        },
      });
    });

    await checkSWFileCacheHeaders();

    expect(logger.warn.callCount).to.equal(1);
  });

  it(`should handle unexpected max-age cache-control header`, async function() {
    if (process.env.NODE_ENV === 'production') this.skip();

    sandbox.stub(self, 'fetch').callsFake(async () => {
      return new Response('OK', {
        headers: {
          'cache-control': 'max-age=abc',
        },
      });
    });

    await checkSWFileCacheHeaders();

    expect(logger.warn.callCount).to.equal(1);
  });

  it(`should NOT log for max-age=0 cache-control header`, async function() {
    if (process.env.NODE_ENV === 'production') this.skip();

    sandbox.stub(self, 'fetch').callsFake(async () => {
      return new Response('OK', {
        headers: {
          'cache-control': 'max-age=0',
        },
      });
    });

    await checkSWFileCacheHeaders();

    expect(logger.warn.callCount).to.equal(0);
  });

  it(`should NOT log for no-cache cache-control header`, async function() {
    if (process.env.NODE_ENV === 'production') this.skip();

    sandbox.stub(self, 'fetch').callsFake(async () => {
      return new Response('OK', {
        headers: {
          'cache-control': 'no-cache',
        },
      });
    });

    await checkSWFileCacheHeaders();

    expect(logger.warn.callCount).to.equal(0);
  });

  it(`should NOT log for no-store cache-control header`, async function() {
    if (process.env.NODE_ENV === 'production') this.skip();

    sandbox.stub(self, 'fetch').callsFake(async () => {
      return new Response('OK', {
        headers: {
          'cache-control': 'no-cache',
        },
      });
    });

    await checkSWFileCacheHeaders();

    expect(logger.warn.callCount).to.equal(0);
  });
});
