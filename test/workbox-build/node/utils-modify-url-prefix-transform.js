const errors = require('../../src/lib/errors');
const expect = require('chai').expect;
const modifyUrlPrefix = require('../../src/lib/utils/modify-url-prefix-transform');

describe(`Test modifyUrlPrefix Logic`, function() {
  /**
   * @return {Array<ManifestEntry>} A fresh manifest.
   */
  function getManifest() {
    return [{
      url: '/first-match/12345/hello',
    }, {
      url: '/second-match/12345/hello',
    }];
  }

  it(`should handle bad URLs in the manifest`, function() {
    const badInputs = [
      null,
      undefined,
      true,
      false,
      {},
      [],
    ];

    const modifications = {
      '/example-1': '/example-1-altered',
      '/example-2/multi-section/1234': '/example-2-altered/5678',
    };

    const transform = modifyUrlPrefix(modifications);
    for (const badInput of badInputs) {
      expect(
        () => transform([{url: badInput}])
      ).to.throw(errors['manifest-entry-bad-url']);
    }
  });

  it(`should handle bad modifyUrlPrefix input`, function() {
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
        () => modifyUrlPrefix(badInput)
      ).to.throw(errors['modify-url-prefix-bad-prefixes']);
    }
  });

  it(`should strip prefixes`, function() {
    const modifications = {
      '/first-match': '',
    };

    const transform = modifyUrlPrefix(modifications);
    expect(transform(getManifest())).to.eql([{
      url: '/12345/hello',
    }, {
      url: '/second-match/12345/hello',
    }]);
  });

  it(`should prepend prefixes`, function() {
    const modifications = {
      '': '/public',
    };

    const transform = modifyUrlPrefix(modifications);
    expect(transform(getManifest())).to.eql([{
      url: '/public/first-match/12345/hello',
    }, {
      url: '/public/second-match/12345/hello',
    }]);
  });

  it(`should only replace the initial match`, function() {
    const modifications = {
      '/first-match': '/second-match',
      '/second-match': '/third-match',
    };

    const transform = modifyUrlPrefix(modifications);
    expect(transform(getManifest())).to.eql([{
      url: '/second-match/12345/hello',
    }, {
      url: '/third-match/12345/hello',
    }]);
  });

  it(`should not replace when the match is not at the start of the URL`, function() {
    const modifications = {
      '/hello': '/altered',
    };

    const transform = modifyUrlPrefix(modifications);
    expect(transform(getManifest())).to.eql(getManifest());
  });
});
