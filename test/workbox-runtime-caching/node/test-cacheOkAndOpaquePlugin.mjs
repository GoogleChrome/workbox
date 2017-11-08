import {expect} from 'chai';
import plugin from '../../../packages/workbox-runtime-caching/plugins/cacheOkAndOpaquePlugin.mjs';

describe(`[workbox-runtime-caching] cacheOkAndOpaquePlugin`, function() {
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
