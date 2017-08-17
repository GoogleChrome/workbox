import {expect} from 'chai';

import core from '../../../../../packages/workbox-core/index.mjs';

describe(`WorkboxCore - ${process.env.NODE_ENV}`, function() {
  describe(`INTERNAL.*`, function() {
    it(`should expose INTERNAL`, function() {
      expect(core.INTERNAL).to.exist;
    });

    it(`should expose logHelper`, function() {
      expect(core.INTERNAL.logHelper).to.exist;
    });
  });
});
