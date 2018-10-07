/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import sinon from 'sinon';
import clearRequire from 'clear-require';
import {expect} from 'chai';

import {assert} from '../../../packages/workbox-core/_private/assert.mjs';

describe(`[workbox-precaching] Module`, function() {
  let precachingModule;
  let sandbox = sinon.createSandbox();

  beforeEach(async function() {
    clearRequire.all();

    // Won't be needed after https://github.com/pinterest/service-workers/pull/44
    // is fixed
    if (process.env.NODE_ENV !== 'production') {
      sandbox.stub(assert, 'isSwEnv').callsFake(() => true);
    }

    // tmp here is to avoid @std/esm weirdness
    let tmp = await import('../../../packages/workbox-precaching/index.mjs');
    precachingModule = tmp;
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('default export', function() {
    it(`should expose known methods`, function() {
      const defaultExport = precachingModule.default;
      expect(Object.keys(defaultExport)).to.deep.equal([
        'precache',
        'addRoute',
        'precacheAndRoute',
        'suppressWarnings',
        'addPlugins',
      ]);
    });

    describe(`precache()`, function() {
      it(`shouldn't throw when precaching assets`, function() {
        const defaultExport = precachingModule.default;
        defaultExport.precache([
          'index.1234.html',
          {
            url: 'test.1234.html',
          },
          {
            url: 'testing.html',
            revision: '1234',
          },
        ]);
      });
    });

    describe(`addRoute()`, function() {
      // TODO @gauntface write tests for this
    });

    describe(`precacheAndRoute()`, function() {
      // TODO @gauntface write tests for this
    });
  });
});
