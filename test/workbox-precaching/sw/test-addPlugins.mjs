/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {addPlugins} from 'workbox-precaching/addPlugins.mjs';
import {precache} from 'workbox-precaching/precache.mjs';
import {getOrCreatePrecacheController} from 'workbox-precaching/utils/getOrCreatePrecacheController.mjs';

describe(`addPlugins()`, function () {
  it(`should add plugins to the strategy`, async function () {
    const plugin1 = {};
    const plugin2 = {};

    precache([{url: '/', revision: null}]);
    addPlugins([plugin1]);

    const pc = getOrCreatePrecacheController();
    expect(pc.strategy.plugins).to.include(plugin1);
    expect(pc.strategy.plugins).not.to.include(plugin2);

    addPlugins([plugin2]);

    expect(pc.strategy.plugins).to.include(plugin1);
    expect(pc.strategy.plugins).to.include(plugin2);
  });
});
