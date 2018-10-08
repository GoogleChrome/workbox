/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import {expect} from 'chai';
import plugin from '../../../packages/workbox-strategies/plugins/cacheOkAndOpaquePlugin.mjs';

describe(`[workbox-strategies] cacheOkAndOpaquePlugin`, function() {
  it(`should return null if status is not ok and status is not opaque`, function() {
    const response = new Response('Hello', {
      status: 404,
    });
    expect(plugin.cacheWillUpdate({response})).to.equal(null);
  });

  it(`should return Response if status is opaque`, function() {
    const response = new Response('Hello', {
      status: 0,
    });
    expect(plugin.cacheWillUpdate({response})).to.equal(response);
  });

  it(`should return Response if status is 200`, function() {
    const response = new Response('Hello', {
      status: 200,
    });
    expect(plugin.cacheWillUpdate({response})).to.equal(response);
  });
});
