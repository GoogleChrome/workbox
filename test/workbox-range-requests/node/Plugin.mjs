import {expect} from 'chai';

import {Plugin} from '../../../packages/workbox-range-requests/Plugin.mjs';

describe(`[workbox-range-requests] Plugin`, function() {
  it(`should expose cachedResponseWillBeUsed method`, function() {
    expect(Plugin.prototype).itself.to.respondTo('cachedResponseWillBeUsed');
  });
});
