/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {BroadcastUpdatePlugin} from '../../../packages/workbox-broadcast-update/BroadcastUpdatePlugin.mjs';

describe(`BroadcastUpdatePlugin`, function () {
  const sandbox = sinon.createSandbox();

  beforeEach(function () {
    sandbox.restore();
  });

  after(function () {
    sandbox.restore();
  });

  describe(`cacheDidUpdate`, function () {
    it(`should call notifyIfUpdated and pass all options`, async function () {
      const bcuPlugin = new BroadcastUpdatePlugin();
      sandbox.stub(bcuPlugin._broadcastUpdate, 'notifyIfUpdated').resolves();

      const opts = {};
      await bcuPlugin.cacheDidUpdate(opts);

      expect(bcuPlugin._broadcastUpdate.notifyIfUpdated.callCount).to.equal(1);
      expect(bcuPlugin._broadcastUpdate.notifyIfUpdated.args[0][0]).to.equal(
        opts,
      );
    });
  });
});
