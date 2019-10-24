/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const errors = require('../../../../packages/workbox-build/src/lib/errors');
const additionalManifestEntriesTransform = require('../../../../packages/workbox-build/src/lib/additional-manifest-entries-transform');

describe(`[workbox-build] lib/additional-manifest-entries-transform.js`, function() {
  function getManifest() {
    return [{
      url: '/first',
      revision: null,
    }];
  }

  it(`should not make any changes when additionalManifestEntries is empty`, function() {
    const transform = additionalManifestEntriesTransform([]);
    expect(transform(getManifest())).to.eql({
      manifest: [{url: '/first', revision: null}],
      warnings: [],
    });
  });

  it(`should add the additionalManifestEntries to the end of the existing manifest`, function() {
    const transform = additionalManifestEntriesTransform([
      {url: '/second', revision: null},
      {url: '/third', revision: null},
    ]);

    expect(transform(getManifest())).to.eql({
      manifest: [
        {url: '/first', revision: null},
        {url: '/second', revision: null},
        {url: '/third', revision: null},
      ],
      warnings: [],
    });
  });

  it(`should return a warning, along with the modified manifest, when additionalManifestEntries contains a string or an entry without revision`, function() {
    const transform = additionalManifestEntriesTransform([
      '/second',
      {url: '/third'},
    ]);

    expect(transform(getManifest())).to.eql({
      manifest: [
        {url: '/first', revision: null},
        '/second',
        {url: '/third'},
      ],
      warnings: [errors['string-entry-warning'] + '\n  - /second\n  - /third\n'],
    });
  });
});
