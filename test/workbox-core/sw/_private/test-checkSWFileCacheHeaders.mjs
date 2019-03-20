/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import sinon from 'sinon';

import {logger} from '../../../../packages/workbox-core/_private/logger.mjs';
import {checkSWFileCacheHeaders} from '../../../../packages/workbox-core/_private/checkSWFileCacheHeaders.mjs';
import {devOnly} from '../../../../infra/testing/env-it';

describe(`workbox-core checkSWFileCacheHeaders`, function() {
  let sandbox;

  before(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  devOnly.it('should handle bad response', async () => {
    sandbox.stub(self, 'fetch').callsFake(async () => {
      return new Response('Not Found.', {
        status: 404,
      });
    });

    await checkSWFileCacheHeaders();

    expect(logger.warn.callCount).to.equal(0);
  });

  devOnly.it('should handle no cache-control header', async () => {
    sandbox.stub(self, 'fetch').callsFake(async () => {
      return new Response('OK');
    });

    await checkSWFileCacheHeaders();

    expect(logger.warn.callCount).to.equal(0);
  });

  devOnly.it('should log for bad cache-control header', async () => {
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

  devOnly.it('should handle unexpected max-age cache-control header', async () => {
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

  devOnly.it('should NOT log for max-age=0 cache-control header', async () => {
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

  devOnly.it('should NOT log for no-cache cache-control header', async () => {
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

  devOnly.it('should NOT log for no-store cache-control header', async () => {
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
