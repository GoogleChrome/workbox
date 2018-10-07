/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import * as backgroundSync
  from '../../../packages/workbox-background-sync/index.mjs';

describe(`[workbox-background-sync] export`, function() {
  it(`should include all public classes on the namespace`, function() {
    expect(backgroundSync).to.have.property('Queue');
  });
});
