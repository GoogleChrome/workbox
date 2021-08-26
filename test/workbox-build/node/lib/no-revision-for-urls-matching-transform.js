/*
  Copyright 2018 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

const expect = require('chai').expect;

const {errors} = require('../../../../packages/workbox-build/build/lib/errors');
const {
  noRevisionForURLsMatchingTransform,
} = require('../../../../packages/workbox-build/build/lib/no-revision-for-urls-matching-transform');

describe(`[workbox-build] lib/no-revision-for-urls-matching-transform.js`, function () {
  const MANIFEST = [
    {
      url: '/first-match/12345/hello',
      revision: '1234abcd',
    },
    {
      url: '/second-match/12345/hello',
      revision: '1234abcd',
    },
    {
      url: '/third-match/12345/hello',
    },
  ];

  it(`should handle bad URLs in the manifest`, function () {
    const badInputs = [null, undefined, true, false, {}, []];

    const transform = noRevisionForURLsMatchingTransform(/ignored/);
    for (const badInput of badInputs) {
      expect(() => transform([{url: badInput}])).to.throw(
        errors['manifest-entry-bad-url'],
      );
    }
  });

  it(`should handle bad dontCacheBustURLsMatching input`, function () {
    const badInputs = [
      null,
      undefined,
      true,
      false,
      [],
      '',
      {
        Hi: [],
      },
    ];

    for (const badInput of badInputs) {
      expect(() => noRevisionForURLsMatchingTransform(badInput)).to.throw(
        errors['invalid-dont-cache-bust'],
      );
    }
  });

  it(`should set revision info to null in a single matching entry`, function () {
    const transform = noRevisionForURLsMatchingTransform(/first-match/);
    expect(transform(MANIFEST)).to.eql({
      manifest: [
        {
          url: '/first-match/12345/hello',
          revision: null,
        },
        {
          url: '/second-match/12345/hello',
          revision: '1234abcd',
        },
        {
          url: '/third-match/12345/hello',
        },
      ],
    });
  });

  it(`should set revision info to null in multiple matching entries`, function () {
    const transform = noRevisionForURLsMatchingTransform(/12345/);
    expect(transform(MANIFEST)).to.eql({
      manifest: [
        {
          url: '/first-match/12345/hello',
          revision: null,
        },
        {
          url: '/second-match/12345/hello',
          revision: null,
        },
        {
          url: '/third-match/12345/hello',
          revision: null,
        },
      ],
    });
  });

  it(`should do nothing when there's a match for an entry without a revision`, function () {
    const transform = noRevisionForURLsMatchingTransform(/third-match/);
    expect(transform(MANIFEST)).to.eql({manifest: MANIFEST});
  });
});
