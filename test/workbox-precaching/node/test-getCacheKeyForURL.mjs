/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import sinon from 'sinon';
import {expect} from 'chai';
import clearRequire from 'clear-require';


describe(`[workbox-precaching] default export`, function() {
  const sandbox = sinon.createSandbox();
  let precache;
  let getCacheKeyForURL;

  beforeEach(async function() {
    sandbox.restore();

    const basePath = '../../../packages/workbox-precaching/';

    // Clear the require cache and then re-import needed modules to assure
    // local variables are reset before each run.
    clearRequire.match(new RegExp('workbox-precaching'));
    precache = (await import(`${basePath}precache.mjs`)).precache;
    getCacheKeyForURL = (await import(`${basePath}getCacheKeyForURL.mjs`)).getCacheKeyForURL;
  });

  after(function() {
    sandbox.restore();
  });

  describe(`getCacheKeyForURL()`, function() {
    it(`should return the expected cache keys for various URLs`, async function() {
      precache(['/one', {url: '/two', revision: '1234'}]);

      expect(getCacheKeyForURL('/one')).to.eql('https://example.com/one');
      expect(getCacheKeyForURL('https://example.com/two'))
          .to.eql('https://example.com/two?__WB_REVISION__=1234');
      expect(getCacheKeyForURL('/not-precached')).to.not.exist;
    });
  });
});
