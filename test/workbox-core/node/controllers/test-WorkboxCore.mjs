import {expect} from 'chai';

import constants from '../../../../gulp-tasks/utils/constants.js';
import core from '../../../../packages/workbox-core/index.mjs';

constants.BUILD_TYPES.forEach((buildType) => {
  describe(`WorkboxCore - ${buildType}`, function() {
    before(function() {
      process.env.NODE_ENV = buildType;
    });

    describe(`INTERNAL.*`, function() {
      it(`should expose INTERNAL`, function() {
        expect(core.INTERNAL).to.exist;
      });

      it(`should expose logHelper`, function() {
        expect(core.INTERNAL.logHelper).to.exist;
      });
    });
  });
});
