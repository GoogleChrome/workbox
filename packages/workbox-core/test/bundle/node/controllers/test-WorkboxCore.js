import {expect} from 'chai';

import WorkboxCore from '../../../../src/controllers/WorkboxCore';

describe(`WorkboxCore - ${process.env.NODE_ENV}`, function() {
  describe(`constructor`, function() {
    it(`should construct with no arguments`, function() {
      new WorkboxCore();
    });
  });

  describe(`INTERNAL.*`, function() {
    it(`should expose INTERNAL`, function() {
      const core = new WorkboxCore();
      expect(core.INTERNAL).to.exist;
    });

    it(`should return the same INTERNAL instance after first call`, function() {
      const core = new WorkboxCore();
      const internal = core.INTERNAL;
      expect(core.INTERNAL).to.equal(internal);
    });

    it(`should expose logHelper`, function() {
      const core = new WorkboxCore();
      expect(core.INTERNAL.logHelper).to.exist;
    });

    it(`should expose assertions only in non-production builds`, function() {
      const core = new WorkboxCore();
      if (process.env.NODE_ENV === 'production') {
        expect(core.INTERNAL.assert).to.not.exist;
      } else {
        expect(core.INTERNAL.assert).to.exist;
      }
    });
  });
});
