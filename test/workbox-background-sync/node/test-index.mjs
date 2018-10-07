import {expect} from 'chai';
import * as backgroundSync
  from '../../../packages/workbox-background-sync/index.mjs';

describe(`[workbox-background-sync] export`, function() {
  it(`should include all public classes on the namespace`, function() {
    expect(backgroundSync).to.have.property('Queue');
  });
});
