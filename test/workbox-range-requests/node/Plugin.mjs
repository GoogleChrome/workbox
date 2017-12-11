import {expect} from 'chai';

import {Plugin} from '../../../packages/workbox-range-requests/Plugin.mjs';

describe(`[workbox-range-requests] Plugin`, function() {
  it(`should expose a static cachedResponseWillBeUsed method`, function() {
    expect(Plugin).itself.to.respondTo('cachedResponseWillBeUsed');
  });
});
