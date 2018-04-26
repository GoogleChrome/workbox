import {expect} from 'chai';

import * as streams from '../../../packages/workbox-streams/index.mjs';

describe(`[workbox-streams] exports`, function() {
  const expectedExports = [
    'concatenate',
    'concatenateToResponse',
    'isSupported',
  ];

  for (const expectedExport of expectedExports) {
    it(`should expose a ${expectedExport} property`, function() {
      expect(streams).to.have.property(expectedExport);
    });
  }
});
