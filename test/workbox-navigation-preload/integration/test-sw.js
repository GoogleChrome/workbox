/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const {runUnitTests} = require('../../../infra/testing/webdriver/runUnitTests');

describe(`[workbox-navigation-preload]`, function () {
  it(`passes all SW unit tests`, async function () {
    await runUnitTests('/test/workbox-navigation-preload/sw/');
  });
});
