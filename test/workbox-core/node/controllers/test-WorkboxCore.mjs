import {expect} from 'chai';
import clearRequire from 'clear-require';

import constants from '../../../../gulp-tasks/utils/constants.js';

describe(`WorkboxCore`, function() {
  beforeEach(function() {
    clearRequire.all();
  });

  describe(`assert.*`, function() {
    it(`should expose assert in dev build`, async function() {
      process.env.NODE_ENV = 'dev';

      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      expect(core.assert).to.exist;
    });

    it(`should NOT expose assert in prod build`, async function() {
      process.env.NODE_ENV = 'prod';

      const coreModule = await import('../../../../packages/workbox-core/index.mjs');
      const core = coreModule.default;

      expect(core.assert).to.not.exist;
    });
  });
});
