import {expect} from 'chai';

import * as cacheableResponse from '../../../packages/workbox-cacheable-response/index.mjs';

describe(`[workbox-cacheable-response] exports`, function() {
  const expectedExports = ['CacheableResponse', 'Plugin'];

  for (const expectedExport of expectedExports) {
    it(`should expose a ${expectedExport} property`, function() {
      expect(cacheableResponse).to.have.property(expectedExport);
    });
  }
});
