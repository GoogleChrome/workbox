const expect = require('chai').expect;

const errors = require('../../../../packages/workbox-build/src/lib/errors');
const noRevisionForUrlsMatching = require('../../../../packages/workbox-build/src/lib/no-revision-for-urls-matching-transform');

describe(`[workbox-build] lib/no-revision-for-urls-matching-transform.js`, function() {
  const MANIFEST = [{
    url: '/first-match/12345/hello',
    revision: '1234abcd',
  }, {
    url: '/second-match/12345/hello',
    revision: '1234abcd',
  }, {
    url: '/third-match/12345/hello',
  }];

  it(`should handle bad URLs in the manifest`, function() {
    const badInputs = [
      null,
      undefined,
      true,
      false,
      {},
      [],
    ];

    const transform = noRevisionForUrlsMatching(/ignored/);
    for (const badInput of badInputs) {
      expect(
        () => transform([{url: badInput}])
      ).to.throw(errors['manifest-entry-bad-url']);
    }
  });

  it(`should handle bad dontCacheBustUrlsMatching input`, function() {
    const badInputs = [
      null,
      undefined,
      true,
      false,
      [],
      '',
      {
        'Hi': [],
      },
    ];

    for (const badInput of badInputs) {
      expect(
        () => noRevisionForUrlsMatching(badInput)
      ).to.throw(errors['invalid-dont-cache-bust']);
    }
  });

  it(`should remove revision info from a single matching entry`, function() {
    const transform = noRevisionForUrlsMatching(/first-match/);
    expect(transform(MANIFEST)).to.eql([{
      url: '/first-match/12345/hello',
    }, {
      url: '/second-match/12345/hello',
      revision: '1234abcd',
    }, {
      url: '/third-match/12345/hello',
    }]);
  });

  it(`should remove revision info from multiple matching entries`, function() {
    const transform = noRevisionForUrlsMatching(/12345/);
    expect(transform(MANIFEST)).to.eql([{
      url: '/first-match/12345/hello',
    }, {
      url: '/second-match/12345/hello',
    }, {
      url: '/third-match/12345/hello',
    }]);
  });

  it(`should do nothing when there's a match for an entry without a revision`, function() {
    const transform = noRevisionForUrlsMatching(/third-match/);
    expect(transform(MANIFEST)).to.eql(MANIFEST);
  });
});
