/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {Plugin} from '../../../packages/workbox-broadcast-update/Plugin.mjs';


describe(`Plugin`, function() {
  const sandbox = sinon.createSandbox();

  beforeEach(function() {
    sandbox.restore();
  });

  after(function() {
    sandbox.restore();
  });

  describe(`cacheDidUpdate`, function() {
    it(`should call notifyIfUpdated and pass all options`, async function() {
      const bcuPlugin = new Plugin();
      sandbox.stub(bcuPlugin._broadcastUpdate, 'notifyIfUpdated');

      const opts = {};
      await bcuPlugin.cacheDidUpdate(opts);

      expect(bcuPlugin._broadcastUpdate.notifyIfUpdated.callCount).to.equal(1);
      expect(bcuPlugin._broadcastUpdate.notifyIfUpdated.args[0][0]).to.equal(opts);
    });
  });
});
