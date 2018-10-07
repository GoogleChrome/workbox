/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';

describe('workbox-core Exports', function() {
  it('should export only expected values', function() {
    return import('../../../packages/workbox-core/index.mjs')
        .then((exportedValues) => {
          expect(Object.keys(exportedValues)).to.deep.equal([
            'LOG_LEVELS',
            '_private',
            'default',
            'registerQuotaErrorCallback',
          ]);
        });
  });

  describe(`LOG_LEVELS`, function() {
    it(`should expose the expected LOG_LEVELS`, async function() {
      const coreModule = await import('../../../packages/workbox-core/index.mjs');
      expect(Object.keys(coreModule.LOG_LEVELS)).to.deep.equal([
        'debug',
        'log',
        'warn',
        'error',
        'silent',
      ]);
    });
  });
});
